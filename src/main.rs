use rust_markov::MarkovChain;
use std::env;
use std::fs::File;
use std::io::{self, BufRead};
use std::path::Path;

fn read_lines<P>(file_path: P) -> io::Result<io::Lines<io::BufReader<File>>>
where
    P: AsRef<Path>,
{
    // returns Err if this open fails
    let file = File::open(file_path)?;
    Ok(io::BufReader::new(file).lines())
}

fn parse_args(args: &Vec<String>) -> (&str, usize, usize) {
    let file_path = &args[1];

    // if we have a 2nd CLI argument use that for output length, defaults to 1000
    let output_length = args
        .get(2)
        .map(|x| x.parse())
        .unwrap_or(Ok(1000))
        .map_err(|_| "Invalid 2nd argument -- output length must be a number")
        .and_then(|n| {
            if (1..=10000).contains(&n) {
                Ok(n)
            } else {
                Err("Invalid 2nd argument -- output length must be between 1 and 10000")
            }
        })
        .unwrap();

    // if we have a 3rd CLI argument use that for n-gram length, defaults to 3
    let n_gram_length = args
        .get(3)
        .map(|x| x.parse())
        .unwrap_or(Ok(3))
        .map_err(|_| "Invalid 3rd argument -- n-gram length must be a number")
        .and_then(|n| {
            if (2..=4).contains(&n) {
                Ok(n)
            } else {
                Err("Invalid 3rd argument -- n-gram length must be between 2 and 4")
            }
        })
        .unwrap();

    return (file_path, output_length, n_gram_length);
}

fn create(args: &Vec<String>) {
    // Parse arguments
    let file_path = &args[0];
    let ngram_length = args
        .get(1)
        .map(|x| x.parse())
        .unwrap()
        .map_err(|_| "Invalid 2nd argument -- n-gram length must be a number")
        .and_then(|n| {
            if (2..=4).contains(&n) {
                Ok(n)
            } else {
                Err("Invalid 3rd argument -- n-gram length must be between 2 and 4")
            }
        })
        .unwrap();
    let mut markov_chain = MarkovChain::new(ngram_length);

    // Read lines into Markov Chain
    if let Ok(lines) = read_lines(file_path) {
        markov_chain.load_lines(lines);
    } else {
        println!("Error reading file");
        return;
    }

    println!("\nSaving Chain to file...");
    match File::create("output2.bin") {
        Ok(write_file) => match markov_chain.save_chain(write_file) {
            Ok(()) => {}
            Err(e) => println!("Error: {}", e),
        },
        Err(e) => println!("Error: {}", e),
    }
}

fn main() {
    let args: Vec<String> = env::args().collect();
    match args.get(1) {
        Some(command) => match command.as_str() {
            "create" => create(&args[2..].to_vec()),
            "run" => println!("Goodbye"),
            "step" => println!("Aloha"),
            _ => println!("Error: Command does not exist"),
        },
        None => println!("Error: No command found"),
    }
}
