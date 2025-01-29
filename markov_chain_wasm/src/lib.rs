use markov_chain::MarkovChain;
use std::io::Cursor;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, Response};

macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

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

    #[wasm_bindgen]
    pub fn peek_next_tokens(&self, count: usize) -> Vec<String> {
        log!(
            "There are {} ngrams in the dict",
            self.chain.get_ngram_count()
        );
        self.chain.peek_next_tokens(count)
    }

    #[wasm_bindgen]
    pub fn put_next_token(&mut self, tk: String) -> Result<String, JsValue> {
        self.chain
            .put_next_token(&tk)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub async fn load_chain(&mut self, url: String, weight: f32) -> Result<(), JsValue> {
        let options = RequestInit::new();
        options.set_method("GET");
        let request = Request::new_with_str_and_init(&url, &options)?;

        let window = web_sys::window().expect("No window exists");
        let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;
        assert!(resp_value.is_instance_of::<Response>());
        let response: Response = resp_value.dyn_into().unwrap();
        let array_buf = JsFuture::from(response.array_buffer()?).await?;
        let buf = js_sys::Uint8Array::new(&array_buf).to_vec();
        log!("Got response of length {}", buf.len());
        let cursor = Cursor::new(buf);

        self.chain
            .merge_chain(cursor, weight)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub fn find_sentence_start(&mut self) -> Result<String, JsValue> {
        self.chain
            .randomize_current_ngram()
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        self.chain
            .seek_next_capital_word()
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}
