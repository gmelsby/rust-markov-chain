use std::env;
use std::fs::File;
use std::io::{self, BufRead};
use std::path::Path;
use std::collections::HashMap;
use std::collections::hash_map::Entry;

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
                for word in line.split(" ") {
                    insert_into_hash_map(&mut ngram_dict, twice_prior_word.clone(), prior_word.clone(), word.to_string());
                    twice_prior_word = prior_word;
                    prior_word = word.to_string();
                }
                println!("{}", line);
            }
        }
    }

    println!("{:?}", ngram_dict);
}
