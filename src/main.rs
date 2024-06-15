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


fn main() {
    let args: Vec<String> = env::args().collect();
    let file_path = &args[1];

    let mut ngram_dict: HashMap<Vec<String>, Vec<String>> =  HashMap::new();

    // string of single-character tokens that we want to separate from the end of words
    // we do not want to add a space before these tokens when printing
    let no_space_tokens = ".,!?\n";
    let format_token = format_token_creator(no_space_tokens.to_string());

    // build dictionary
    if let Ok(lines) = read_lines(file_path) {
        let mut prior_words: Vec<String> = Vec::with_capacity(2);
        prior_words.resize(2, "\n".to_string());
        for line in lines.flatten() {
            // if we have a blank line insert newline character
            if line.len() == 0 {
                insert_into_hash_map(&mut ngram_dict, prior_words.clone(), "\n".to_string());
                prior_words[0] = prior_words[1].clone();
                prior_words[1] = "\n".to_string();
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
                        insert_into_hash_map(&mut ngram_dict, prior_words.clone(), word[0..word.len()-1].to_string());
                        insert_into_hash_map(&mut ngram_dict, vec![prior_words[1].clone(), word[0..word.len()-1].to_string()], word[word.len()-1..word.len()].to_string());
                        prior_words[0] = word[0..word.len()-1].to_string();
                        prior_words[1] = word[word.len()-1..word.len()].to_string();
                    } else {
                        insert_into_hash_map(&mut ngram_dict, prior_words.clone(), word.to_string());
                        prior_words[0] = prior_words[1].clone();
                        prior_words[1] = word.to_string();
                    }
                }
            }
        }
    }

    let mut prior_words = get_random_n_gram(&ngram_dict).unwrap();

    for _ in 0..100 {
        let next_word_list = ngram_dict.get(&prior_words);

        // if there is no next token, prints 2 newlines and loads a random n-gram into prior_words
        if next_word_list == None {
            println!("\n");
            prior_words = get_random_n_gram(&ngram_dict).unwrap();
            print_n_gram(&prior_words, &format_token)
        }
        
        
        // choose next word from 
        let mut next_word = "\n".to_string();
        let next_word_candidate = next_word_list.unwrap().choose(&mut rand::thread_rng());
        match next_word_candidate {
            Some(word) => {
                next_word = word.clone();
            }
            // pass on None
            None => {}
        }

        print!("{}", format_token(&prior_words[0]));
        prior_words[0] = prior_words[1].clone();
        prior_words[1] = next_word;
    }


}
