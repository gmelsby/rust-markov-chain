import { useState } from 'react';
import { IconContext } from 'react-icons';
import { MdInfoOutline } from 'react-icons/md';
import Modal from './Modal';
import { FaGithub } from 'react-icons/fa';

function Info() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconContext.Provider value={{ size: "25" }}>
        <button className="cursor-pointer" onClick={() => setOpen(true)}><MdInfoOutline /></button>
      </IconContext.Provider>
      <Modal open={open} title='About' closeOnClickOut onClose={() => setOpen(false)}>
        <div className='flex flex-col justify-around items-center grow overflow-auto'>
          <div className='flex flex-col items-center mw-sm'>
            <p>A <a href='https://en.wikipedia.org/wiki/Markov_chain'
              target='_blank'
              rel='noopener noreferrer'
              className='font-semibold'>
              Markov Chain
            </a> is an iterative stochastic process that uses the current state of a system and a probability distribution dependent on the current state of the system to generate the next state of the system.</p>
            <p>This application enables users to generate text utilizing a Markov process that takes the current state of the system to be the last <em>n</em> generated words (an <em>n-gram</em> of length <em>n</em>) and selects possible next words
              based upon the likelihood that a word follows the current <em>n-gram</em> in the source texts.</p>
            <p><a href='https://en.wikipedia.org/wiki/Mark_V._Shaney'
              target='_blank'
              rel='noopener noreferrer'
              className='font-semibold'>
              Mark V. Shaney
            </a> and <a href='https://en.wikipedia.org/wiki/Dissociated_press'
              target='_blank'
              rel='noopener noreferrer'
              className='font-semibold'>
                Dissociated press
              </a> are examples of this form of text generation using Markov Chain techniques.
            </p>
            <p>Users can merge multiple Markov chains together from different text sources to create a composite Markov chain that considers word frequency information from multiple texts during generation.</p>
            <p>Users can also modify the relative weight of sources when choosing multiple chains in order to tune the behavior of the text generator.</p>
            <h4>Disclaimer</h4>
            <p>The inclusion of chains generated from works should not be read as an endorsement of the views expressed in those works. Additionally, no endorsement is made of the randomly-generated text output of this application or any potential views expressed therein.</p>

            <h4>Technical Info</h4>
            <p>React application, Markov Chain library in Rust compiled to WASM</p>
            <p>
              <a
                className='flex items-center'
                href='https://github.com/gmelsby/rust-markov-chain'
                target='_blank'
                rel='noopener noreferrer'
              >
                <FaGithub />
                <span className='ml-2'>GitHub repo</span></a></p>
          </div>
        </div>

      </Modal >
    </>
  );

}

export default Info;