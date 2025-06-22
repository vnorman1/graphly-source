import React from 'react';
import { FileUploadInputProps } from '../types';
import InputLabel from './InputLabel';

const FileUploadInput: React.FC<FileUploadInputProps> = ({ id, label, buttonText, accept, onChange, className }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onChange(event.target.files[0]);
    }
  };

  return (
    <div className={className}>
      {label && <InputLabel text={label} htmlFor={id} />}
      <input
        type="file"
        id={id}
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <label
        htmlFor={id}
        className={`block w-full bg-gray-100 border border-gray-300 p-3 rounded-md text-center cursor-pointer font-semibold text-gray-700 hover:bg-gray-200 transition-colors ${label ? 'mt-2' : ''}`}
      >
        {buttonText}
      </label>
    </div>
  );
};

export default FileUploadInput;