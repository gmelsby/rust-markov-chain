use std::env;
use std::fs::File;
use std::io::{self, BufRead};
use std::path::Path;
//use std::collections::HashMap;

fn read_lines<P>(file_path: P) -> io::Result<io::Lines<io::BufReader<File>>> 
where P: AsRef<Path>, {
    // returns Err if this open fails
    let file = File::open(file_path)?;
    Ok(io::BufReader::new(file).lines())
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let file_path = &args[1];

    //let ngram_dict: HashMap<(String, String), String> =  HashMap::new();

    if let Ok(lines) = read_lines(file_path) {

        for line in lines.flatten() {
            println!("{}", line);
        }
    }
}
