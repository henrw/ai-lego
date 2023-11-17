// Let's make <Card text='Write the docs' /> draggable!

import React from 'react'
import { useDrag } from 'react-dnd'
import { ItemTypes } from './Constants'
import { useState } from 'react'

/**
 * Your Component
 */
export default function Card({ isDragging }) {
  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type: ItemTypes.CARD,
      item: {},
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1
      })
    }),
    []
  );

  const [text, setText] = useState("");

  return (
    <div ref={dragRef} style={{ opacity }} className='rounded-lg border-2 p-2 border-black w-full my-2 h-28'>
      <textarea
        placeholder="Enter text here"
        value={text}
        onChange={(event) => { setText(event.target.value); }}
        className='w-full h-full'
      />
    </div>
  )
}