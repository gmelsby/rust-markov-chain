use std::env;
use std::fs::File;
use std::io::{self, BufRead};
use std::path::Path;
use std::collections::HashMap;
use std::collections::hash_map::Entry;
use rand::seq::SliceRandom;

fn read_lines<P>(file_path: P) -> io::Result<io::Lines<io::BufReader<File>>> 
where P: AsRef<Path>, {
    // returns Err if this open fails
    let file = File::open(file_path)?;
    Ok(io::BufReader::new(file).lines())
}

fn insert_into_hash_map(dict: &mut HashMap<Vec<String>, Vec<String>>, prior_ngram: Vec<String>, current: String) {
    match dict.entry(prior_ngram) {
        Entry::Vacant(e) => { e.insert(vec![current]); },
        Entry::Occupied(mut e) => { e.get_mut().push(current); }
    }
}

// returns a function that adds a space to the front of a token if it is not one of the characters
fn format_token_creator(characters: String) -> impl Fn(&String) -> String {
    move |tk| format!("{}{}",  if !characters.contains(&*tk) {" "} else {""}, *tk)
}

fn get_random_n_gram(dict: &HashMap<Vec<String>, Vec<String>>) -> Option<Vec<String>>
{
    // make binding for borrow checker
    let binding = dict
        .keys()
        .cloned()
        .collect::<Vec<Vec<String>>>();

    let random_n_gram = binding.choose(&mut rand::thread_rng());
    random_n_gram.cloned()
}

fn print_n_gram(n_gram: &Vec<String>, format_token: &impl Fn(&String) -> String) {
        for token in n_gram {
            print!("{}", format_token(&token));
        }
}

fn push_to_prior_tokens(prior_tokens: &mut Vec<String>, token: String) {
    let prior_tokens_length = prior_tokens.len();
        for i in 0..(prior_tokens_length - 1) {
        prior_tokens[i] = prior_tokens[i+1].clone();
    }
    prior_tokens[prior_tokens_length - 1] = token;
}


fn main() {
    let args: Vec<String> = env::args().collect();
    let file_path = &args[1];
    let n_gram_length = 3;

    let mut ngram_dict: HashMap<Vec<String>, Vec<String>> =  HashMap::new();

    // string of single-character tokens that we want to separate from the end of words
    // we do not want to add a space before these tokens when printing
    let no_space_tokens = ".,!?\n";
    let format_token = format_token_creator(no_space_tokens.to_string());

    // build dictionary
    if let Ok(lines) = read_lines(file_path) {
        // start with blank lines
        let mut prior_tokens: Vec<String> = Vec::with_capacity(n_gram_length);
        prior_tokens.resize(n_gram_length, "\n".to_string());
        for line in lines.flatten() {
            // if we have a blank line insert newline character
            if line.len() == 0 {
                insert_into_hash_map(&mut ngram_dict, prior_tokens.clone(), "\n".to_string());
                push_to_prior_tokens(&mut prior_tokens, "\n".to_string());
           } else {
                for word in line.split_whitespace() {
                    // check if word is more than one character and end character needs to be split 
                    if word.len() > 1 && word.ends_with(|c| {
                        for symbol in no_space_tokens.chars() {
                            if c == symbol {
                                return true;
                            }
                        }
                        false
                    }) {
                        let word_body = word[0..word.len()-1].to_string();
                        insert_into_hash_map(&mut ngram_dict, prior_tokens.clone(), word_body.clone());
                        push_to_prior_tokens(&mut prior_tokens, word_body.clone());

                        let word_ending = word[word.len()-1..word.len()].to_string();
                        insert_into_hash_map(&mut ngram_dict, prior_tokens.clone(), word_ending.clone());
                        push_to_prior_tokens(&mut prior_tokens, word[word.len()-1..word.len()].to_string());
                    } else {
                        insert_into_hash_map(&mut ngram_dict, prior_tokens.clone(), word.to_string());
                        push_to_prior_tokens(&mut prior_tokens, word.to_string());
                    }
                }
            }
        }
    }

    // start with blank lines
    let mut prior_tokens = Vec::with_capacity(n_gram_length);
    prior_tokens.resize(n_gram_length, "\n".to_string());

    for _ in 0..1000 {
        let next_token_list = ngram_dict.get(&prior_tokens);

        // if there is no next token, prints 2 newlines and loads a random n-gram into prior_tokens
        if next_token_list == None {
            println!("\n");
            prior_tokens = get_random_n_gram(&ngram_dict).unwrap();
            print_n_gram(&prior_tokens, &format_token)
        }
        
        
        // choose next token from 
        let mut next_token = "\n".to_string();
        let next_token_candidate = next_token_list.unwrap().choose(&mut rand::thread_rng());
        match next_token_candidate {
            Some(token) => {
                next_token = token.clone();
            }
            // pass on None
            None => {}
        }

        print!("{}", format_token(&prior_tokens[0]));
        push_to_prior_tokens(&mut prior_tokens, next_token)
    }
}
