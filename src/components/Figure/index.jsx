import React from 'react';

/**
 * A diagram with its caption.
 *
 *   import Partition from './img/quicksort-partition.svg';
 *   <Figure caption="Partitioning around the pivot."><Partition /></Figure>
 */
export default function Figure({ caption, children }) {
  return (
    <figure className="dg-figure">
      {children}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
