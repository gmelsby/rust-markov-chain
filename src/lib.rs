use rand::prelude::*;
use std::collections::hash_map::Entry;
use std::collections::HashMap;
use std::io::{self, Lines};

// Characters that should not have a space inserted before
const NO_SPACE_TOKENS: &str = ".,!?\n";

pub struct MarkovChain {
    ngram_length: usize,
    ngram_distribution: HashMap<Vec<String>, Vec<(String, f32)>>,
    current_ngram: Vec<String>,
}

impl MarkovChain {
    // Constructor to create a new MarkovChain
    pub fn new(ngram_length: usize) -> MarkovChain {
        let mut current_ngram = Vec::with_capacity(ngram_length);
        current_ngram.resize(ngram_length, "\n".to_string());

        MarkovChain {
            ngram_length,
            ngram_distribution: HashMap::new(),
            current_ngram,
        }
    }

    // Inserts appropriate mapping between ngram and current word into HashMap
    fn insert_into_ngram_dict(
        map: &mut HashMap<Vec<String>, Vec<String>>,
        prior_ngram: Vec<String>,
        current_word: String,
    ) {
        match map.entry(prior_ngram) {
            Entry::Vacant(e) => {
                e.insert(vec![current_word]);
            }
            Entry::Occupied(mut e) => {
                e.get_mut().push(current_word);
            }
        }
    }

    // Modifies prior_tokens in place to remove first element and place new token at the end
    fn push_to_prior_tokens(prior_tokens: &mut Vec<String>, token: String) {
        let prior_tokens_length = prior_tokens.len();
        for i in 0..(prior_tokens_length - 1) {
            prior_tokens[i] = prior_tokens[i + 1].clone();
        }
        prior_tokens[prior_tokens_length - 1] = token;
    }

    pub fn load_lines(&mut self, lines: Lines<std::io::BufReader<std::fs::File>>) {
        // Creates dictionary that maps from ngram to list of following tokens
        let mut ngram_dict: HashMap<Vec<String>, Vec<String>> = HashMap::new();
        // Set prior tokens the start of the text to be newlines
        let mut prior_tokens = Vec::with_capacity(self.ngram_length);
        prior_tokens.resize(self.ngram_length, "\n".to_string());

        for line in lines.flatten() {
            if line.len() == 0 {
                // If we have a blank line insert newline character
                Self::insert_into_ngram_dict(
                    &mut ngram_dict,
                    prior_tokens.clone(),
                    "\n".to_string(),
                );

                Self::push_to_prior_tokens(&mut prior_tokens, "\n".to_string());
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
                        // Insert body of word
                        Self::insert_into_ngram_dict(
                            &mut ngram_dict,
                            prior_tokens.clone(),
                            word_body.clone(),
                        );
                        Self::push_to_prior_tokens(&mut prior_tokens, word_body.clone());

                        // Insert the ending character as a separate token
                        let word_ending = word[word.len() - 1..word.len()].to_string();
                        Self::insert_into_ngram_dict(
                            &mut ngram_dict,
                            prior_tokens.clone(),
                            word_ending.clone(),
                        );
                        Self::push_to_prior_tokens(
                            &mut prior_tokens,
                            word[word.len() - 1..word.len()].to_string(),
                        );
                    } else {
                        // Case where we just have one token
                        Self::insert_into_ngram_dict(
                            &mut ngram_dict,
                            prior_tokens.clone(),
                            word.to_string(),
                        );
                        Self::push_to_prior_tokens(&mut prior_tokens, word.to_string());
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
            let mut counter: HashMap<String, isize> = HashMap::new();
            for token in values {
                counter
                    .entry(token.to_string())
                    .and_modify(|e| *e += 1)
                    .or_insert(1);
            }

            // Adds normalized count to ngram_distribution
            for (token, count) in counter.iter() {
                let token_probability = (*count as f32) / (denominator as f32);
                match self.ngram_distribution.entry(ngram.to_vec()) {
                    Entry::Vacant(e) => {
                        e.insert(vec![(token.to_string(), token_probability)]);
                    }
                    Entry::Occupied(mut e) => {
                        e.get_mut().push((token.to_string(), token_probability));
                    }
                }
            }
        }
    }

    // Clears and resets the current ngram to be all newlines
    pub fn clear_current_ngram(&mut self) {
        self.current_ngram.clear();
        self.current_ngram
            .resize(self.ngram_length, "\n".to_string());
    }

    // Returns a possible next token in the Markov chain
    pub fn peek_next_token(&mut self) -> String {
        let next_token_distribution = self.ngram_distribution.get(&self.current_ngram);

        let mut next_token = "\n".to_string();
        let mut rng = thread_rng();
        // Check that next_token_list is not None
        match next_token_distribution {
            Some(token_distribution) => {
                let next_token_entry =
                    token_distribution.choose_weighted(&mut rng, |entry| entry.1);
                // Check that next_token_candidate is not None
                match next_token_entry {
                    Ok(token_entry) => {
                        next_token = token_entry.0.to_string();
                    }
                    // pass on None (case where list is empty)
                    Err(_) => {}
                }
            }
            // pass on None (case where list is empty)
            None => {}
        }
        return next_token;
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
        let next_token_list: Vec<String> = self
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

        // If token is not a possible next token,
        if !next_token_list.contains(token) {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Token is not a possible next token for current ngram",
            ));
        }
        // Push token to current ngram
        Self::push_to_prior_tokens(&mut self.current_ngram, token.clone());
        return Ok(Self::format_token(token));
    }
}
