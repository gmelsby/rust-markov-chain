use flate2::read::ZlibDecoder;
use flate2::write::ZlibEncoder;
use flate2::Compression;
use postcard::{from_bytes, to_stdvec};
use rand::prelude::*;
use serde::{Deserialize, Serialize};
use std::io::{Cursor, Error, Read, Write};

use std::collections::hash_map::Entry;
use std::collections::HashMap;
use std::io::{self};

// Characters that should not have a space inserted before
const NO_SPACE_BEFORE_TOKENS: &str = ">)]}:.,!?;\n";
// Characters that should not have a space inserted after
const NO_SPACE_AFTER_TOKENS: &str = "<([{\n";
// Quotation marks that should have a space before them in the dict if they start a word
const QUOTES: &str = "\"“”'’‘`";

// For serializing and deserializing neccesary information for generating a Markov Chain
#[derive(Serialize, Deserialize)]
struct ChainEncoding {
    ngram_length: usize,
    token_list: Vec<String>,
    ngram_distribution: HashMap<Vec<usize>, Vec<(usize, f32)>>,
}

// Enum for specifying load_lines parameter
#[derive(PartialEq)]
pub enum LoadMode {
    PreserveAllNewlines,
    PreserveDoubleNewlines,
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

    // Returns count of how many ngrams are in the ngram_distribution dict
    pub fn get_ngram_count(&self) -> usize {
        self.ngram_distribution.len()
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

    pub fn load_lines<I>(&mut self, lines: I, mode: LoadMode)
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
            // If we take in an empty string and mode is PreserveDoubleNewlines, handle and continue looping
            if line.trim().is_empty() && mode == LoadMode::PreserveDoubleNewlines {
                // Add extra newline if the prior token was not a newline
                if prior_tokens.last().cloned().unwrap() != newline_token {
                    Self::insert_into_ngram_dict(
                        &mut ngram_dict,
                        prior_tokens.clone(),
                        newline_token,
                    );
                    Self::push_to_prior_tokens(&mut prior_tokens, newline_token);
                }

                // Add newline when we encounter empty line
                Self::insert_into_ngram_dict(&mut ngram_dict, prior_tokens.clone(), newline_token);
                Self::push_to_prior_tokens(&mut prior_tokens, newline_token);

                continue;
            }

            // Check if line needs to be split
            for word in line.split_whitespace() {
                // For storing constituent tokens in reverse order
                let mut end_tokens: Vec<String> = Vec::new();
                let mut word_string = word.to_string();
                // Loop while word ends with a special token
                while !word_string.is_empty()
                    && word_string.ends_with(|c| {
                        for symbol in NO_SPACE_BEFORE_TOKENS.chars().chain(QUOTES.chars()) {
                            if c == symbol {
                                return true;
                            }
                        }
                        false
                    })
                {
                    let word_ending = word_string.pop().unwrap().to_string();
                    end_tokens.push(word_ending);
                }

                let mut tokens: Vec<String> = Vec::new();

                // Loop while word starts with a special token
                while !word_string.is_empty()
                    && word_string.starts_with(|c| {
                        for symbol in NO_SPACE_AFTER_TOKENS.chars().chain(QUOTES.chars()) {
                            if c == symbol {
                                return true;
                            }
                        }
                        false
                    })
                {
                    // Make left-space quote if left-most character is a quote
                    let mut word_beginning = word_string.remove(0).to_string();
                    if QUOTES.contains(word_beginning.as_str()) {
                        word_beginning.insert(0, ' ');
                    }
                    tokens.push(word_beginning);
                }

                // Check that word_string is not empty before pushing
                if !word_string.is_empty() {
                    tokens.push(word_string);
                }

                // Add end tokens to end of tokens vec in correct order
                tokens.extend(end_tokens.iter().rev().cloned());

                // Insert all tokens that made up our string
                for token in tokens.iter() {
                    let token_int = self.token_dict.add_token(token);
                    Self::insert_into_ngram_dict(&mut ngram_dict, prior_tokens.clone(), token_int);
                    Self::push_to_prior_tokens(&mut prior_tokens, token_int);
                }
            }

            // Add newline on end of line if we are preserving newlines
            if mode == LoadMode::PreserveAllNewlines {
                Self::insert_into_ngram_dict(&mut ngram_dict, prior_tokens.clone(), newline_token);
                Self::push_to_prior_tokens(&mut prior_tokens, newline_token);
            }
        }

        // Pad end of text with newlines so at worst case it will wrap around to the start of text
        for _ in 0..self.ngram_length {
            Self::insert_into_ngram_dict(
                &mut ngram_dict,
                prior_tokens.clone(),
                self.get_newline_token(),
            );
            Self::push_to_prior_tokens(&mut prior_tokens, newline_token);
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

        let mut e = ZlibEncoder::new(Vec::new(), Compression::default());
        e.write_all(
            &to_stdvec(&encoding).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?,
        )?;
        let compressed_buf = e.finish().unwrap();
        writer.write_all(&compressed_buf[..])?;
        Ok(())
    }

    fn read_chain_from_reader<R: Read>(mut reader: R) -> Result<ChainEncoding, std::io::Error> {
        // Read from reader
        let mut buf: Vec<u8> = Vec::new();
        reader.read_to_end(&mut buf)?;
        let mut decoder = ZlibDecoder::new(Cursor::new(buf));
        let mut decomprssed_buf = Vec::new();
        decoder.read_to_end(&mut decomprssed_buf)?;

        Ok(from_bytes(&decomprssed_buf).unwrap())
    }

    // Loads MarkovChain from ChainEncoding in a serialized postcard format
    pub fn load_chain<R: Read>(&mut self, reader: R) -> Result<(), std::io::Error> {
        let new_chain_encoding = Self::read_chain_from_reader(reader)?;
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
    pub fn merge_chain<R: Read>(&mut self, reader: R, scale: f32) -> Result<(), std::io::Error> {
        let new_chain_encoding = Self::read_chain_from_reader(reader)?;
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

    // Transforms a ChainEncoding into a full MarkovChain
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
    pub fn peek_next_tokens(&self, count: usize) -> Vec<(String, usize)> {
        let next_token_distribution = self.ngram_distribution.get(&self.current_ngram);

        let mut next_tokens = Vec::with_capacity(self.ngram_length);
        next_tokens.resize(
            self.ngram_length,
            ("\n".to_string(), self.get_newline_token()),
        );

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
                            (
                                self.token_dict
                                    .convert_int_to_string(*tk)
                                    .expect("Error converting token int to string"),
                                *tk,
                            )
                        })
                        .collect();
                }
            }
            None => {}
        }
        // TODO: gracefully handle no next token
        next_tokens
    }

    // Adds a space to the front of a token if it is not one of the special characters or preceeded by a special character
    pub fn format_token(&self, token: &String) -> String {
        let last_token_str = self
            .token_dict
            .convert_int_to_string(
                *self
                    .current_ngram
                    .get(self.current_ngram.len() - 2)
                    .unwrap(),
            )
            .unwrap_or_default();
        // Left space quotes already have a space before them
        let left_space_quotes: Vec<String> = QUOTES.chars().map(|c| format!(" {}", c)).collect();

        let space = if NO_SPACE_BEFORE_TOKENS.contains(token)
            || QUOTES.contains(token)
            || left_space_quotes.contains(token)
            || NO_SPACE_AFTER_TOKENS.contains(last_token_str.as_str())
            || left_space_quotes.contains(&last_token_str)
        {
            ""
        } else {
            " "
        };

        // Special case where we have a left-space quote after a new-line
        let special_case_token = if left_space_quotes.contains(token) && last_token_str == "\n" {
            token.trim()
        } else {
            token
        };

        format!("{}{}", space, special_case_token)
    }

    // Returns formatted token for the current ngram
    pub fn put_next_token(&mut self, token: usize) -> Result<(String, usize), io::Error> {
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
            return Ok(("\n".to_string(), self.get_newline_token()));
        }

        // If token is not a possible next token,
        if !next_token_list.contains(&token) {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Token is not a possible next token for current ngram",
            ));
        }
        // Push token to current ngram
        Self::push_to_prior_tokens(&mut self.current_ngram, token);
        return Ok((
            self.format_token(&self.token_dict.convert_int_to_string(token).unwrap()),
            token,
        ));
    }

    // Seeks a words after newlines further in the current chain and returns it at the end of its prior ngram in Result
    // If it cannot find a newline, returns current ngram + arbitrary next token
    pub fn seek_next_word_after_newline(&mut self) -> Vec<(String, usize)> {
        let newline_token = self.get_newline_token();
        for _ in 0..1000 {
            // Look at next possible tokens
            let candidates = self.peek_next_tokens(15);

            let non_newline_candidates: Vec<(String, usize)> = candidates
                .iter()
                .filter(|&(_, tk_int)| *tk_int != newline_token)
                .cloned()
                .collect();

            // If last token was a newline and we have a non-newline candidate, return prior ngram + a non-newline candidate
            if !non_newline_candidates.is_empty()
                && self.current_ngram.last().cloned().unwrap() == newline_token
            {
                let prior_ngram_result: Result<Vec<(String, usize)>, Error> = self
                    .current_ngram
                    .iter()
                    .map(|i| self.token_dict.convert_int_to_string(*i).map(|s| (s, *i)))
                    .collect();
                let mut prior_ngram_words = prior_ngram_result.unwrap();
                prior_ngram_words.push(non_newline_candidates[0].clone());
                return prior_ngram_words;
            }

            // If last token was not a newline but there is a newline in the candidates, move chain forward with newline
            if candidates.len() != non_newline_candidates.len() {
                _ = self.put_next_token(newline_token);
            } else {
                // Otherwise move chain forward with arbitrary token
                _ = self.put_next_token(candidates[0].1);
            }
        }

        let mut default_result: Vec<(String, usize)> = self
            .current_ngram
            .clone()
            .into_iter()
            .map(|tk| (self.token_dict.convert_int_to_string(tk).unwrap(), tk))
            .collect();
        let candidate = &self.peek_next_tokens(1)[0];
        default_result.push(candidate.clone());
        default_result
    }

    // Loads a random ngram from dict into current_ngram
    pub fn randomize_current_ngram(&mut self) -> Result<(), io::Error> {
        match self
            .ngram_distribution
            .keys()
            .choose(&mut rand::thread_rng())
        {
            Some(ngram) => {
                self.current_ngram = ngram.to_vec();
                Ok(())
            }
            None => Err(io::Error::new(
                io::ErrorKind::NotFound,
                "No ngrams in the dictionary",
            )),
        }
    }

    // Replaces the current_ngram in self with the int values in the passed-in ngram
    pub fn replace_current_ngram(&mut self, ngram: Vec<usize>) -> Result<(), io::Error> {
        match self.ngram_distribution.get(&ngram) {
            Some(_) => {
                self.current_ngram = ngram;
                Ok(())
            }
            None => Err(io::Error::new(
                io::ErrorKind::NotFound,
                "Ngram not found in the dictionary",
            )),
        }
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
