use markov_chain::MarkovChain;
use std::fs::File;
use std::io::{self, BufRead};
use std::path::Path;
use std::{env, fs};

fn read_lines<P>(file_path: P) -> io::Result<io::Lines<io::BufReader<File>>>
where
    P: AsRef<Path>,
{
    // returns Err if this open fails
    let file = File::open(file_path)?;
    Ok(io::BufReader::new(file).lines())
}

fn create(args: &Vec<String>) {
    // Parse arguments
    let file_path = Path::new(&args[0]);
    let ngram_length = args
        .get(1)
        .map(|x| x.parse())
        .unwrap()
        .map_err(|_| "Invalid 2nd argument -- n-gram length must be a number")
        .and_then(|n| {
            if (2..=4).contains(&n) {
                Ok(n)
            } else {
                Err("Invalid 2nd argument -- n-gram length must be between 2 and 4")
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

    let file_stem = file_path.file_stem().unwrap();
    let new_path = Path::new("chains")
        .join(file_stem)
        .join(ngram_length.to_string());

    match fs::create_dir_all(new_path.parent().unwrap()) {
        Ok(_) => {}
        Err(e) => {
            println!("Error creating path: {}", e);
            return;
        }
    }

    println!("\nSaving Chain to file...");
    match File::create(new_path) {
        Ok(write_file) => match markov_chain.save_chain(write_file) {
            Ok(()) => {}
            Err(e) => println!("Error: {}", e),
        },
        Err(e) => println!("Error: {}", e),
    }
}

fn run(args: &Vec<String>) -> Result<(), std::io::Error> {
    let ngram_length = Path::new(&args[0])
        .file_stem()
        .unwrap()
        .to_str()
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap();
    let mut markov_chain = MarkovChain::new(ngram_length);
    for chunk in args.chunks(2) {
        println!("Loading {}", chunk[0]);
        if let [path, weight] = chunk {
            match weight.parse::<f32>() {
                Ok(weight_float) => match File::open(path) {
                    Ok(merge_file) => match markov_chain.merge_chain(merge_file, weight_float) {
                        Ok(()) => {}
                        Err(e) => return Err(e),
                    },
                    Err(e) => return Err(e),
                },
                Err(_) => {
                    return Err(std::io::Error::new(
                        std::io::ErrorKind::InvalidInput,
                        "Could not parse float",
                    ))
                }
            }
        } else {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "Could not parse arguents into chunks",
            ));
        }
    }

    println!("Chain loaded... generating output\n");
    for _ in 0..1000 {
        let next_tokens = markov_chain.peek_next_tokens(1).clone();

        match markov_chain.put_next_token(&next_tokens[0]) {
            Ok(tk) => {
                print!("{}", tk);
            }
            Err(_) => {}
        }
    }
    Ok(())
}

fn main() {
    let args: Vec<String> = env::args().collect();
    match args.get(1) {
        Some(command) => match command.as_str() {
            "create" => create(&args[2..].to_vec()),
            "run" => match run(&args[2..].to_vec()) {
                Ok(_) => {}
                Err(e) => println!("Error: {}", e),
            },
            _ => println!("Error: Command does not exist"),
        },
        None => println!("Error: No command found"),
    }
}
