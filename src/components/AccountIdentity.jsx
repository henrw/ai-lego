import React from 'react';
import { profileAvatar, roleLabel } from '../utils/avatar';
export default function AccountIdentity({ author, fallbackName = 'Anonymous' }) {
  const name = author?.name || fallbackName;
  return <span className="flex items-center gap-2 min-w-0">
    <img className="w-8 h-8 rounded-full flex-shrink-0" src={profileAvatar(author, author?.uid || name)} alt="" draggable={false} />
    <span className="text-xs"><span className="font-semibold">{name}</span>{author?.occupation && <span className="ml-1 text-gray-500">· {roleLabel(author.occupation)}</span>}</span>
  </span>;
}
