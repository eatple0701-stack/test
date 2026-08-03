// Shrinking a photo before it leaves the phone.
//
// Lived inside AuthSheet as a private helper for avatars until meal photos
// needed the same thing, and a second copy of canvas-resizing code is how two
// features quietly end up with different quality and different bugs. The
// avatar's rules — square crop, 256px — turned out to be avatar rules rather
// than image rules, so they are arguments now.
//
// Why it exists at all: venue wifi. A modern phone photo is 3–8MB, and a
// traveller uploading one while standing outside a restaurant is the person
// least able to wait for it. Resizing in the browser costs one frame and
// turns that into ~150KB.

/**
 * @param {File} file        what the file input handed back
 * @param {object} options
 * @param {number} options.size    longest edge, in pixels
 * @param {boolean} options.square centre-crop to a square (faces) or keep the
 *                                 photo's own shape (meals)
 * @param {number} options.quality JPEG quality, 0–1
 * @returns {Promise<string>} a data URL
 */
export function downscale(file, { size = 256, square = true, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (square) {
        // Centre-crop, because avatars render round and a stretched face
        // helps nobody get recognised at a station exit.
        const side = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(
          img,
          (img.width - side) / 2, (img.height - side) / 2, side, side,
          0, 0, size, size,
        );
      } else {
        // A meal keeps its shape. Cropping a table of dishes to a square is
        // how the 반찬 at the edge disappears, and the spread is the point.
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    img.src = url;
  });
}

/** What a face is shrunk to: square, small, quick. */
export const AVATAR = { size: 256, square: true, quality: 0.85 };

/** What a meal is shrunk to: its own shape, big enough to see the food. */
export const MEAL_PHOTO = { size: 1280, square: false, quality: 0.8 };
