import { type Dispatch, type SetStateAction, useState } from "react";

interface MemeImageUploaderProps {
  image: string | null;
  setImage: Dispatch<SetStateAction<string | null>>;
}

export default function MemeImageUploader({
  image,
  setImage,
}: MemeImageUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImage(URL.createObjectURL(file));
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer h-64 bg-neutral-800"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      {image ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={image}
            alt="Uploaded meme"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 mb-4 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p className="text-center text-gray-400 mb-2">
            Drag and drop your meme image here
          </p>
          <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
        </>
      )}
      <input
        id="file-input"
        type="file"
        accept="image/png, image/jpeg, image/gif, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
