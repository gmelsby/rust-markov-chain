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


fn main() {
    let args: Vec<String> = env::args().collect();
    let file_path = &args[1];

    let mut ngram_dict: HashMap<Vec<String>, Vec<String>> =  HashMap::new();

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
                    if word.ends_with(|c| {
                        for symbol in ".,!?".chars() {
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

    let mut prior_words: Vec<String> = Vec::with_capacity(2);
    prior_words.resize(2, String::new());

    // make binding for borrow checker
    let binding = ngram_dict
        .keys()
        .cloned()
        .collect::<Vec<Vec<String>>>();

    let starting_words = binding.choose(&mut rand::thread_rng());
    match starting_words {
        Some(key) => {
            prior_words = key.clone();
            println!("{} {}", prior_words[0], prior_words[1]);
        }
        None => {
            print!("something went wrong here!");
            return;
        }
    }

    loop {
        let val = ngram_dict.get(&prior_words);

        // if there is no next token, prints 2 newlines and loads a random n-gram into prior_words
        if val == None {
            // make binding for borrow checker
            let binding = ngram_dict
                .keys()
                .cloned()
                .collect::<Vec<Vec<String>>>();


            let starting_words = binding.choose(&mut rand::thread_rng());
            match starting_words {
                Some(key) => {
                        prior_words = key.clone();
                        println!("{} {}", prior_words[0], prior_words[1]);
                },
                None => {
                    print!("something went wrong here!");
                    return;
                }
            }           
        }
        
        
        let mut next_word = "\n".to_string();
        let next_word_candidate = val.unwrap().choose(&mut rand::thread_rng());
        match next_word_candidate {
            Some(word) => {
                next_word = word.clone();
            }
            // pass on None
            None => {}
        }

        // add space in front of word if token is not punctuation
        print!("{}{}",  if !".,?!".contains(&next_word) {" "} else {""}, next_word);

        prior_words[0] = prior_words[1].clone();
        prior_words[1] = next_word;
    }


}
