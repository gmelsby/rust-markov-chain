import Button from './Button';

interface ButtonProps {
  content: string,
  onClick: () => void,
  key: string,
}

function WordButtons({ buttonList }:
  {
    buttonList: ButtonProps[],
  }) {
  return (
    <>
      {
        buttonList.map(({ content, onClick, key }) =>
          <Button key={key} {...{ onClick }}>{content}</Button>
        )
      }
    </>
  );
}

export default WordButtons;