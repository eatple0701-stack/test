import React from 'react';
import { animalOf } from '../domain/catalog/animals.js';

// The twelve faces. See src/domain/catalog/animals.js for why they are drawn
// here rather than fetched, and why the choice is a hash rather than a die.
//
// Each is built from the same parts on a 40×40 grid — a head, ears, two eyes,
// a muzzle — so twelve animals read as one set rather than twelve clip-art
// downloads. The ink is a single dark brown at 0.85 opacity on every tint,
// which is what lets one ink colour sit legibly on all twelve washes.
//
// They are decorative: every call site already prints the person's name
// beside the avatar, so these carry aria-hidden and add nothing for a screen
// reader to repeat.

const INK = '#3D2E24';

/* Ears drawn behind the head, so the head's outline crosses them cleanly. */
const FACES = {
  tiger: (
    <>
      <path d="M9 13c-1-4 0-6 2-6s3 2 4 4M31 13c1-4 0-6-2-6s-3 2-4 4" fill={INK} opacity="0.85" />
      <circle cx="20" cy="22" r="11" fill={INK} opacity="0.85" />
      <path d="M13 14c1 2 1.5 4 1.5 6M27 14c-1 2-1.5 4-1.5 6M20 12v4" stroke="#FFE8CC" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <circle cx="16" cy="21" r="1.6" fill="#FFE8CC" />
      <circle cx="24" cy="21" r="1.6" fill="#FFE8CC" />
      <path d="M20 25.5c-1.6 0-2.4 1-2.4 2 0 1 1 1.8 2.4 1.8s2.4-.8 2.4-1.8c0-1-.8-2-2.4-2Z" fill="#FFE8CC" />
    </>
  ),
  bear: (
    <>
      <circle cx="11" cy="12" r="4.5" fill={INK} opacity="0.85" />
      <circle cx="29" cy="12" r="4.5" fill={INK} opacity="0.85" />
      <circle cx="20" cy="22" r="11" fill={INK} opacity="0.85" />
      <circle cx="16" cy="20" r="1.6" fill="#EFE0D2" />
      <circle cx="24" cy="20" r="1.6" fill="#EFE0D2" />
      <ellipse cx="20" cy="26" rx="5" ry="4" fill="#EFE0D2" />
      <ellipse cx="20" cy="24.5" rx="1.8" ry="1.3" fill={INK} opacity="0.85" />
    </>
  ),
  rabbit: (
    <>
      <ellipse cx="15" cy="9" rx="2.8" ry="7.5" fill={INK} opacity="0.85" />
      <ellipse cx="25" cy="9" rx="2.8" ry="7.5" fill={INK} opacity="0.85" />
      <circle cx="20" cy="24" r="10" fill={INK} opacity="0.85" />
      <circle cx="16.5" cy="22" r="1.5" fill="#FDE2E4" />
      <circle cx="23.5" cy="22" r="1.5" fill="#FDE2E4" />
      <path d="M20 26v2M20 28c-1 1-2.5 1-3.5.4M20 28c1 1 2.5 1 3.5.4" stroke="#FDE2E4" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </>
  ),
  fox: (
    <>
      <path d="M9 8l4 8-5 1zM31 8l-4 8 5 1z" fill={INK} opacity="0.85" />
      <path d="M20 12c6 0 10 4 10 8s-4 6-6 8c-1.6 1.4-3 2.5-4 2.5s-2.4-1.1-4-2.5c-2-2-6-4-6-8s4-8 10-8Z" fill={INK} opacity="0.85" />
      <circle cx="16.5" cy="20" r="1.5" fill="#FFE0C7" />
      <circle cx="23.5" cy="20" r="1.5" fill="#FFE0C7" />
      <circle cx="20" cy="27" r="1.8" fill="#FFE0C7" />
    </>
  ),
  cat: (
    <>
      <path d="M11 15V7l6 4zM29 15V7l-6 4z" fill={INK} opacity="0.85" />
      <circle cx="20" cy="22" r="11" fill={INK} opacity="0.85" />
      <circle cx="16" cy="20" r="1.6" fill="#E8E4F3" />
      <circle cx="24" cy="20" r="1.6" fill="#E8E4F3" />
      <path d="M20 24.5v1.5M20 26c-.8.9-2 .9-2.8.3M20 26c.8.9 2 .9 2.8.3M9 23h5M26 23h5" stroke="#E8E4F3" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </>
  ),
  dog: (
    <>
      <ellipse cx="9.5" cy="18" rx="3.5" ry="7" fill={INK} opacity="0.85" />
      <ellipse cx="30.5" cy="18" rx="3.5" ry="7" fill={INK} opacity="0.85" />
      <circle cx="20" cy="22" r="10.5" fill={INK} opacity="0.85" />
      <circle cx="16.5" cy="20" r="1.5" fill="#FBE7C6" />
      <circle cx="23.5" cy="20" r="1.5" fill="#FBE7C6" />
      <ellipse cx="20" cy="26" rx="4.5" ry="3.6" fill="#FBE7C6" />
      <ellipse cx="20" cy="24.8" rx="1.7" ry="1.2" fill={INK} opacity="0.85" />
    </>
  ),
  magpie: (
    <>
      <path d="M20 10c5 0 9 4.5 9 10s-4 10-9 10-9-4.5-9-10 4-10 9-10Z" fill={INK} opacity="0.85" />
      <path d="M20 17c3 0 5.5 2.5 5.5 6.5S23 30 20 30s-5.5-2.5-5.5-6.5S17 17 20 17Z" fill="#DEE9F5" />
      <circle cx="17" cy="16" r="1.5" fill="#DEE9F5" />
      <circle cx="23" cy="16" r="1.5" fill="#DEE9F5" />
      <path d="M20 19l3.5 2.5-3.5 2.5-3.5-2.5z" fill="#F5A623" />
    </>
  ),
  deer: (
    <>
      <path d="M13 12V6M13 8l-3-2M13 9l3-2.5M27 12V6M27 8l3-2M27 9l-3-2.5" stroke={INK} strokeOpacity="0.85" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <ellipse cx="20" cy="23" rx="9.5" ry="10.5" fill={INK} opacity="0.85" />
      <circle cx="16.5" cy="21" r="1.5" fill="#EADFD3" />
      <circle cx="23.5" cy="21" r="1.5" fill="#EADFD3" />
      <ellipse cx="20" cy="27" rx="2.6" ry="2" fill="#EADFD3" />
    </>
  ),
  squirrel: (
    <>
      <path d="M31 30c4-3 4-10 0-14-3-3-7-2-8 1 3 0 5 2 5 5s-2 5-5 6c2 3 6 4 8 2Z" fill={INK} opacity="0.85" />
      <path d="M14 13V8l4 3zM24 13V8l-4 3z" fill={INK} opacity="0.85" />
      <circle cx="18" cy="23" r="9.5" fill={INK} opacity="0.85" />
      <circle cx="15" cy="21" r="1.5" fill="#FCE1D0" />
      <circle cx="21.5" cy="21" r="1.5" fill="#FCE1D0" />
      <ellipse cx="18.5" cy="26.5" rx="2.2" ry="1.8" fill="#FCE1D0" />
    </>
  ),
  frog: (
    <>
      <circle cx="13" cy="14" r="5" fill={INK} opacity="0.85" />
      <circle cx="27" cy="14" r="5" fill={INK} opacity="0.85" />
      <circle cx="13" cy="14" r="2.2" fill="#DCF2E0" />
      <circle cx="27" cy="14" r="2.2" fill="#DCF2E0" />
      <path d="M20 16c7 0 11 3.5 11 8s-5 7-11 7-11-2.5-11-7 4-8 11-8Z" fill={INK} opacity="0.85" />
      <path d="M15 26c1.6 1.8 3.2 2.6 5 2.6s3.4-.8 5-2.6" stroke="#DCF2E0" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </>
  ),
  owl: (
    <>
      <path d="M10 12l3 5M30 12l-3 5" stroke={INK} strokeOpacity="0.85" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <ellipse cx="20" cy="23" rx="10.5" ry="10" fill={INK} opacity="0.85" />
      <circle cx="16" cy="21" r="3.6" fill="#E4E7EE" />
      <circle cx="24" cy="21" r="3.6" fill="#E4E7EE" />
      <circle cx="16" cy="21" r="1.5" fill={INK} opacity="0.85" />
      <circle cx="24" cy="21" r="1.5" fill={INK} opacity="0.85" />
      <path d="M20 25l2.2 3h-4.4z" fill="#F5A623" />
    </>
  ),
  turtle: (
    <>
      <circle cx="20" cy="12" r="4.5" fill={INK} opacity="0.85" />
      <circle cx="18.4" cy="11.5" r="1.2" fill="#D9F0E8" />
      <circle cx="21.6" cy="11.5" r="1.2" fill="#D9F0E8" />
      <ellipse cx="20" cy="25" rx="12" ry="8.5" fill={INK} opacity="0.85" />
      <path d="M20 17v16M11 25h18M14 19.5l12 11M26 19.5l-12 11" stroke="#D9F0E8" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </>
  ),
};

/**
 * @param {object} props
 * @param {string} props.seed  Whatever identifies this person — a user id, a
 *   host id, a signup id. The same seed always draws the same animal.
 * @param {string} [props.animal]  A stored choice, which wins over the seed.
 * @param {number} [props.size]
 * @param {string} [props.className]  So each call site keeps its own sizing
 *   and border rules rather than this component guessing them.
 */
export default function AnimalAvatar({ seed, animal = null, size = 36, className = '' }) {
  const pick = animalOf({ avatarAnimal: animal, seed });
  return (
    <svg
      className={`animal-avatar ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="20" cy="20" r="20" fill={pick.tint} />
      {FACES[pick.id]}
    </svg>
  );
}
