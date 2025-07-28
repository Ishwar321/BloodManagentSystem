import React from "react";

const InputType = ({
  labelFor,
  labelText,
  inputType,
  value,
  onChange,
  name,
  required = false,
}) => {
  return (
    <>
      <div className="mb-1">
        <label htmlFor={labelFor} className="form-label">
          {labelText}
        </label>
        <input
          type={inputType}
          className="form-control"
          name={name}
          value={value}
          onChange={onChange}
          required={required}
        />
      </div>
    </>
  );
};

export default InputType;
