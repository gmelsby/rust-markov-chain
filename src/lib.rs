extern crate serde;

use postcard::{from_bytes, to_stdvec};
use rand::prelude::*;
use serde::{Deserialize, Serialize};
use std::io::{Error, Read, Write};

use std::collections::hash_map::Entry;
use std::collections::HashMap;
use std::io::{self};

// Characters that should not have a space inserted before
const NO_SPACE_TOKENS: &str = ".,!?\n";

// For serializing and deserializing neccesary information for generating a Markov Chain
#[derive(Serialize, Deserialize)]
struct ChainEncoding {
    ngram_length: usize,
    token_list: Vec<String>,
    ngram_distribution: HashMap<Vec<usize>, Vec<(usize, f32)>>,
}

pub struct MarkovChain {
    ngram_length: usize,
    token_dict: TokenDict,
    ngram_distribution: HashMap<Vec<usize>, Vec<(usize, f32)>>,
    current_ngram: Vec<usize>,
}

impl MarkovChain {
    // Constructor to create a new MarkovChain
    pub fn new(ngram_length: usize) -> MarkovChain {
        let mut token_dict = TokenDict::new();
        let newline_int = token_dict.add_token(&"\n".to_string());
        let mut current_ngram = Vec::with_capacity(ngram_length);
        current_ngram.resize(ngram_length, newline_int);

        MarkovChain {
            ngram_length,
            token_dict,
            ngram_distribution: HashMap::new(),
            current_ngram,
        }
    }

    // Inserts appropriate mapping between ngram and current token into HashMap
    fn insert_into_ngram_dict(
        map: &mut HashMap<Vec<usize>, Vec<usize>>,
        prior_ngram: Vec<usize>,
        current_token: usize,
    ) {
        match map.entry(prior_ngram) {
            Entry::Vacant(e) => {
                e.insert(vec![current_token]);
            }
            Entry::Occupied(mut e) => {
                e.get_mut().push(current_token);
            }
        }
    }

    // Modifies prior_tokens in place to remove first element and place new token at the end
    fn push_to_prior_tokens(prior_tokens: &mut Vec<usize>, token: usize) {
        let prior_tokens_length = prior_tokens.len();
        for i in 0..(prior_tokens_length - 1) {
            prior_tokens[i] = prior_tokens[i + 1].clone();
        }
        prior_tokens[prior_tokens_length - 1] = token;
    }

    pub fn load_lines<I>(&mut self, lines: I)
    where
        I: IntoIterator<Item = Result<String, Error>>,
    {
        // Creates dictionary that maps from ngram to list of following tokens
        let mut ngram_dict: HashMap<Vec<usize>, Vec<usize>> = HashMap::new();
        // Set prior tokens the start of the text to be newlines
        let mut prior_tokens = Vec::with_capacity(self.ngram_length);
        let newline_token = self.get_newline_token();

        prior_tokens.resize(self.ngram_length, newline_token);

        for line in lines.into_iter().flatten() {
            if line.len() == 0 {
                // If we have a blank line insert newline character
                Self::insert_into_ngram_dict(&mut ngram_dict, prior_tokens.clone(), newline_token);

                Self::push_to_prior_tokens(&mut prior_tokens, newline_token);
            } else {
                //
                for word in line.split_whitespace() {
                    // Check if word is more than one character and end character needs to be split
                    if word.len() > 1
                        && word.ends_with(|c| {
                            for symbol in NO_SPACE_TOKENS.chars() {
                                if c == symbol {
                                    return true;
                                }
                            }
                            false
                        })
                    {
                        // Case where we split word into two tokens
                        let word_body = word[0..word.len() - 1].to_string();
                        let word_body_int = self.token_dict.add_token(&word_body);
                        // Insert converted body of word
                        Self::insert_into_ngram_dict(
                            &mut ngram_dict,
                            prior_tokens.clone(),
                            word_body_int,
                        );
                        Self::push_to_prior_tokens(&mut prior_tokens, word_body_int);

                        // Insert the ending character int as a separate token
                        let word_ending = word[word.len() - 1..word.len()].to_string();
                        let word_ending_int = self.token_dict.add_token(&word_ending);

                        Self::insert_into_ngram_dict(
                            &mut ngram_dict,
                            prior_tokens.clone(),
                            word_ending_int,
                        );
                        Self::push_to_prior_tokens(&mut prior_tokens, word_ending_int);
                    } else {
                        // Case where we just have one token
                        let word_int = self.token_dict.add_token(word);
                        Self::insert_into_ngram_dict(
                            &mut ngram_dict,
                            prior_tokens.clone(),
                            word_int,
                        );
                        Self::push_to_prior_tokens(&mut prior_tokens, word_int);
                    }
                }
            }
        }

        // Convert ngram_dict to normalized probability distribution for ngram_distribution
        for (ngram, values) in ngram_dict.iter() {
            // Get total length size for normalization denominator
            let denominator = values.len();
            // Check that denominator is nonzero
            if denominator == 0 {
                continue;
            }

            // Keeps track of how many instances of each token are in the Vec
            let mut counter: HashMap<usize, usize> = HashMap::new();
            for token in values {
                counter.entry(*token).and_modify(|e| *e += 1).or_insert(1);
            }

            // Adds normalized count to ngram_distribution
            for (token, count) in counter.iter() {
                let token_probability = (*count as f32) / (denominator as f32);
                match self.ngram_distribution.entry(ngram.to_vec()) {
                    Entry::Vacant(e) => {
                        e.insert(vec![(*token, token_probability)]);
                    }
                    Entry::Occupied(mut e) => {
                        e.get_mut().push((*token, token_probability));
                    }
                }
            }
        }
    }

    // Stores the MarkovChain as a ChainEncoding in a serialized postcard format
    pub fn save_chain<W: Write>(&self, mut writer: W) -> Result<(), std::io::Error> {
        // Create ChainEncoding with relevant info
        let encoding = ChainEncoding {
            ngram_length: self.ngram_length,
            token_list: self.token_dict.int_to_string.clone(),
            ngram_distribution: self.ngram_distribution.clone(),
        };

        let buf =
            to_stdvec(&encoding).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
        writer.write_all(&buf[..])?;
        Ok(())
    }

    // Loads MarkovChain from ChainEncoding in a serialized postcard format
    pub fn load_chain<R: Read>(&mut self, mut reader: R) -> Result<(), std::io::Error> {
        // Read file
        let mut buf: Vec<u8> = Vec::new();
        reader.read_to_end(&mut buf)?;

        let new_chain_encoding: ChainEncoding = from_bytes(&buf).unwrap();
        // Check that chain length is the same
        if new_chain_encoding.ngram_length != self.ngram_length {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "improper ngram length",
            ));
        }

        let new_chain = Self::generate_chain_from_encoding(&new_chain_encoding);
        self.token_dict = new_chain.token_dict;
        self.ngram_distribution = new_chain.ngram_distribution;

        Ok(())
    }

    // Merges MarkovChain from ChainEncoding in a serialized postcard format with probabilities modified by weight
    pub fn merge_chain<R: Read>(
        &mut self,
        mut reader: R,
        scale: f32,
    ) -> Result<(), std::io::Error> {
        // Read into buffer
        let mut buf: Vec<u8> = Vec::new();
        reader.read_to_end(&mut buf)?;

        let new_chain_encoding: ChainEncoding = from_bytes(&buf).unwrap();
        // Check that chain length is the same
        if new_chain_encoding.ngram_length != self.ngram_length {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "improper ngram length",
            ));
        }

        let new_chain = Self::generate_chain_from_encoding(&new_chain_encoding);
        // Make map to hold mapping from new_chain token int values to current chain token int values
        let mut tk_int_map: HashMap<usize, usize> = HashMap::new();
        // Merge token dicts by adding every token in new_chain and keeping track of map of int values from new_chain to main chain
        for (tk_int, tk) in new_chain.token_dict.int_to_string.iter().enumerate() {
            let main_tk_int = self.token_dict.add_token(tk);
            tk_int_map.insert(tk_int, main_tk_int);
        }

        // Merge token distributions
        for (new_ngram, new_distribution_entry) in new_chain.ngram_distribution.iter() {
            let translated_ngram: Vec<usize> = new_ngram.iter().map(|tk| tk_int_map[tk]).collect();
            // Looks up corresponding ngram in the main distribution and creates entry if none exists
            let main_distribution_entry = self
                .ngram_distribution
                .entry(translated_ngram)
                .or_insert_with(Vec::new);

            for (new_tk, new_probability) in new_distribution_entry {
                let translated_tk = tk_int_map[new_tk];
                match main_distribution_entry
                    .iter_mut()
                    .find(|(tk, _)| *tk == translated_tk)
                {
                    Some((_, p)) => *p += scale * new_probability,
                    None => main_distribution_entry.push((translated_tk, scale * new_probability)),
                }
            }
        }

        Ok(())
    }

    fn generate_chain_from_encoding(encoding: &ChainEncoding) -> MarkovChain {
        let mut new_chain = Self::new(encoding.ngram_length);
        // Set up token_dict from encoded list
        let mut new_token_dict = TokenDict::new();
        new_token_dict.load_from_token_list(&encoding.token_list);
        new_chain.token_dict = new_token_dict;
        // Copy over encoded ngram_distribution
        new_chain.ngram_distribution = encoding.ngram_distribution.clone();
        new_chain.clear_current_ngram();
        new_chain
    }

    // Clears and resets the current ngram to be all newlines
    pub fn clear_current_ngram(&mut self) {
        self.current_ngram.clear();
        let newline_token = self.get_newline_token();
        self.current_ngram.resize(self.ngram_length, newline_token);
    }

    // Returns int representation of newline token
    fn get_newline_token(&self) -> usize {
        return self
            .token_dict
            .convert_string_to_int(&"\n".to_string())
            .expect("Newline does not exist in token_dict");
    }

    // Returns a Vec of possible next tokens in the Markov chain
    pub fn peek_next_tokens(&mut self, count: usize) -> Vec<String> {
        let next_token_distribution = self.ngram_distribution.get(&self.current_ngram);

        let mut next_tokens = Vec::with_capacity(self.ngram_length);
        next_tokens.resize(self.ngram_length, "\n".to_string());

        let mut rng = thread_rng();
        // Check that next_token_list is not None
        match next_token_distribution {
            Some(token_distribution) => {
                let next_token_entries = token_distribution
                    .choose_multiple_weighted(&mut rng, count, |entry| entry.1)
                    .unwrap()
                    .collect::<Vec<_>>();
                // Map int tokens to their corresponding strings
                if !next_token_entries.is_empty() {
                    next_tokens = next_token_entries
                        .iter()
                        .map(|(tk, _)| {
                            self.token_dict
                                .convert_int_to_string(*tk)
                                .expect("Error converting token int to string")
                        })
                        .collect();
                }
            }
            None => {}
        }
        // TODO: gracefully handle no next token
        next_tokens
    }

    // Adds a space to the front of a token if it is not one of the special characters
    pub fn format_token(token: &String) -> String {
        // Returns a function that adds a space to the front of a token if it is not one of the characters
        fn format_token_creator(characters: String) -> impl Fn(&String) -> String {
            move |tk| {
                format!(
                    "{}{}",
                    if !characters.contains(&*tk) { " " } else { "" },
                    *tk
                )
            }
        }
        return format_token_creator(NO_SPACE_TOKENS.to_string())(token);
    }

    // Returns formatted token for the current ngram
    pub fn put_next_token(&mut self, token: &String) -> Result<String, io::Error> {
        // Check that token is a possible next token
        let next_token_list: Vec<usize> = self
            .ngram_distribution
            .get(&self.current_ngram)
            .unwrap_or(&Vec::new())
            .iter()
            .cloned()
            .map(|(t, _)| t)
            .collect();

        // If no tokens match, return newline and reset the current ngram
        if next_token_list.len() == 0 {
            self.clear_current_ngram();
            return Ok("\n".to_string());
        }

        let token_int = self
            .token_dict
            .convert_string_to_int(token)
            .expect("String not in token dictionary");

        // If token is not a possible next token,
        if !next_token_list.contains(&token_int) {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Token is not a possible next token for current ngram",
            ));
        }
        // Push token to current ngram
        Self::push_to_prior_tokens(&mut self.current_ngram, token_int);
        return Ok(Self::format_token(token));
    }
}

// Keeps track of which integers correspond with which tokens
struct TokenDict {
    int_to_string: Vec<String>,
    string_to_int: HashMap<String, usize>,
}

impl TokenDict {
    pub fn new() -> TokenDict {
        TokenDict {
            int_to_string: Vec::new(),
            string_to_int: HashMap::new(),
        }
    }

    // Adds String token to TokenDict if not already in, either way returns corresponding int
    pub fn add_token(&mut self, tk: &str) -> usize {
        match self.string_to_int.get(tk) {
            // Return index
            Some(key) => return *key,
            None => {
                // Add String to Vec
                self.int_to_string.push(tk.to_string());
                // Get index int
                let new_index = self.int_to_string.len() - 1;
                // Add index to HashMap
                self.string_to_int.insert(tk.to_string(), new_index);
                return new_index;
            }
        }
    }

    // Returns corresponding string if exists, error if not
    pub fn convert_int_to_string(&self, idx: usize) -> Result<String, std::io::Error> {
        match self.int_to_string.get(idx) {
            Some(str) => Ok(str.to_string()),
            None => Err(io::Error::new(
                io::ErrorKind::NotFound,
                "No corresponding string exists",
            )),
        }
    }

    // Returns corresponding int if exists, error if not
    pub fn convert_string_to_int(&self, tk: &String) -> Result<usize, std::io::Error> {
        match self.string_to_int.get(tk) {
            Some(int) => Ok(*int),
            None => Err(io::Error::new(
                io::ErrorKind::NotFound,
                "No corresponding int exists",
            )),
        }
    }

    // Loads in a int_to_string list and turns into a full bidirectional TokenDict
    pub fn load_from_token_list(&mut self, tk_list: &Vec<String>) {
        // Clear out old HashMap
        self.string_to_int = HashMap::new();

        self.int_to_string = tk_list.clone();
        for (idx, tk) in self.int_to_string.iter().enumerate() {
            self.string_to_int.insert(tk.to_string(), idx);
        }
    }
}
