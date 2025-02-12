use idb::{Factory, TransactionMode};
use js_sys::Uint8Array;
use markov_chain::MarkovChain;
use std::io::{BufRead, BufReader, Cursor};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, Response};

macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

#[wasm_bindgen]
pub struct Token {
    str: String,
    int: usize,
}

#[wasm_bindgen]
impl Token {
    #[wasm_bindgen(constructor)]
    pub fn new(str: String, int: usize) -> Token {
        Token { str, int }
    }

    #[wasm_bindgen]
    pub fn get_str(&self) -> String {
        return self.str.to_string();
    }

    #[wasm_bindgen]
    pub fn get_int(&self) -> usize {
        return self.int;
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
    pub fn create_from_file(&mut self, file_data: Uint8Array) -> Result<(), JsValue> {
        let cursor = Cursor::new(file_data.to_vec());
        let reader = BufReader::new(cursor);
        let lines = reader.lines();
        self.chain.load_lines(lines);
        Ok(())
    }

    #[wasm_bindgen]
    pub async fn write_chain_to_indexedb(
        &self,
        db_name: &str,
        object_store_name: &str,
        key: &str,
    ) -> Result<(), JsValue> {
        // Create buffer to write to db
        let mut buffer = Vec::new();
        self.chain
            .save_chain(&mut buffer)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        let blob = Uint8Array::from(buffer.as_slice());

        // Open db
        let factory = Factory::new().map_err(|e| JsValue::from_str(&e.to_string()))?;
        let open_request = factory.open(db_name, Some(1)).unwrap();

        let db = open_request
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        // Start making transaction object
        let transaction = db
            .transaction(&[object_store_name], TransactionMode::ReadWrite)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let store = transaction
            .object_store(object_store_name)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let id = store
            .put(&blob, Some(&JsValue::from_str(key)))
            .unwrap()
            .await;

        // Return error if something went wrong when inserting value
        if !id.is_ok() {
            return Err(JsValue::from_str("Unable to make transaction"));
        }

        // Commit transaction
        transaction.commit().unwrap().await.unwrap();

        db.close();
        Ok(())
    }

    #[wasm_bindgen]
    pub fn peek_next_tokens(&self, count: usize) -> Result<Vec<Token>, JsValue> {
        log!(
            "There are {} ngrams in the dict",
            self.chain.get_ngram_count()
        );
        let tokens = self.chain.peek_next_tokens(count);
        let result = tokens
            .iter()
            .map(|(tk_str, tk_int)| Token {
                str: tk_str.to_string(),
                int: *tk_int,
            })
            .collect();
        return Ok(result);
    }

    #[wasm_bindgen]
    pub fn put_next_token(&mut self, tk: usize) -> Result<String, JsValue> {
        self.chain
            .put_next_token(tk)
            .map(|(tk_str, _)| tk_str)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub async fn load_chain_from_server(&mut self, url: &str, weight: f32) -> Result<(), JsValue> {
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
    pub async fn load_chain_from_indexeddb(
        &mut self,
        db_name: &str,
        object_store_name: &str,
        key: &str,
        weight: f32,
    ) -> Result<(), JsValue> {
        // Open db
        let factory = Factory::new().map_err(|e| JsValue::from_str(&e.to_string()))?;
        let open_request = factory.open(db_name, Some(1)).unwrap();

        let db = open_request
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        // Start making transaction object
        let transaction = db
            .transaction(&[object_store_name], TransactionMode::ReadWrite)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let store = transaction
            .object_store(object_store_name)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let stored_chain: Option<JsValue> = store
            .get(JsValue::from_str(key))
            .map_err(|e| JsValue::from_str(&e.to_string()))?
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        if let Some(chain_data) = stored_chain {
            let array_buf = chain_data.dyn_into::<Uint8Array>().unwrap();
            let buf = js_sys::Uint8Array::new(&array_buf).to_vec();
            log!("Got response of length {}", buf.len());
            let cursor = Cursor::new(buf);

            self.chain
                .merge_chain(cursor, weight)
                .map_err(|e| JsValue::from_str(&e.to_string()))
        } else {
            return Err(JsValue::from_str("Unable to read chain data"));
        }
    }

    #[wasm_bindgen]
    pub fn find_paragraph_start(&mut self) -> Result<Vec<Token>, JsValue> {
        self.chain
            .randomize_current_ngram()
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let paragraph_start = self.chain.seek_next_word_after_newline();
        let result = paragraph_start
            .iter()
            .map(|(tk_str, tk_int)| Token {
                str: tk_str.to_string(),
                int: *tk_int,
            })
            .collect();
        return Ok(result);
    }

    #[wasm_bindgen]
    pub fn load_ngram(&mut self, ngram: Vec<usize>) -> Result<(), JsValue> {
        self.chain
            .replace_current_ngram(ngram)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    // Returns true if no elements are in the chain's ngram dictionary
    #[wasm_bindgen]
    pub fn is_empty(&self) -> bool {
        self.chain.get_ngram_count() == 0
    }
}
