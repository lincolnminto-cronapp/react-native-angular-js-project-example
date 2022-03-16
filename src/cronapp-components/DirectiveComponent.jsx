import React from 'react';

const DirectiveComponent = (props) => {
  return (
    <>
      <p>Eu sou um componente React</p>
      <Tarso></Tarso>
    </>
  );
};

const Tarso = (props) => {
  return <>oi Tarso, seje omilde!</>;
};


export default DirectiveComponent;
