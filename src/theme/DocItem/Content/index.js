import React from 'react';
import Content from '@theme-original/DocItem/Content';
import ListenButton from '@site/src/components/ListenButton';

export default function ContentWrapper(props) {
  return (
    <>
      <ListenButton />
      <Content {...props} />
    </>
  );
}
