use markov_chain::MarkovChain;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WasmMarkovChain {
    chain: MarkovChain,
}

#[wasm_bindgen]
impl WasmMarkovChain {
    #[wasm_bindgen(constructor)]
    pub fn new(ngram_length: usize) -> WasmMarkovChain {
        WasmMarkovChain {
            chain: MarkovChain::new(ngram_length),
        }
    }
}
