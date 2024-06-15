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

fn insert_into_hash_map(dict: &mut HashMap<(String, String), Vec<String>>, twice_prior: String, prior: String, current: String) {
    match dict.entry((twice_prior, prior)) {
        Entry::Vacant(e) => { e.insert(vec![current]); },
        Entry::Occupied(mut e) => { e.get_mut().push(current); }
    }
}


fn main() {
    let args: Vec<String> = env::args().collect();
    let file_path = &args[1];

    let mut ngram_dict: HashMap<(String, String), Vec<String>> =  HashMap::new();

    // build dictionary
    if let Ok(lines) = read_lines(file_path) {
        let mut prior_word = "\n".to_string();
        let mut twice_prior_word = "\n".to_string();
        for line in lines.flatten() {
            // if we have a blank line insert newline character
            if line.len() == 0 {
                insert_into_hash_map(&mut ngram_dict, twice_prior_word.clone(), prior_word.clone(), "\n".to_string());
                twice_prior_word = prior_word;
                prior_word = "\n".to_string();
            } else {
                for word in line.split_whitespace() {
                    insert_into_hash_map(&mut ngram_dict, twice_prior_word.clone(), prior_word.clone(), word.to_string());
                    twice_prior_word = prior_word;
                    prior_word = word.to_string();
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
        .collect::<Vec<(String, String)>>();

    let starting_words = binding.choose(&mut rand::thread_rng());
    match starting_words {
        Some((first, second)) => {
            prior_words[0] = first.clone();
            prior_words[1] = second.clone();
            println!("{} {}", first, second);
        }
        None => {
            print!("something went wrong here!");
            return;
        }
    }

    loop {
        let next_word_candidate = ngram_dict[&(prior_words[0].clone(), prior_words[1].clone())]
            .choose(&mut rand::thread_rng());
        let mut next_word = "\n".to_string();
        match next_word_candidate {
            Some(word) => {
                next_word = word.clone();
            }
            // pass on None
            None => {}
        }

        print!(" {}", next_word);

        prior_words[0] = prior_words[1].clone();
        prior_words[1] = next_word;
    }


}
