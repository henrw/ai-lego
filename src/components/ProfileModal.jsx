import OpenAIKeyField from './OpenAIKeyField';
// ProfileModal.jsx
import React from "react";
import { Modal } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";

const ProfileModal = ({
  showModal,
  setShowModal,
  handleSubmit,
  handleClose,
  userProfile,
  handleImageChange,
  uploadProfileImage,
  deleteProfileImage,
  randomizeProfileImage,
  profileImageUrl,
  fields,
  handleFieldChange,
  customInputs,
  handleCustomInputChange,
}) => {
  return (
    <Modal
      show={showModal}
      onHide={handleClose}
      size="xl"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton className="border border-blue-400 bg-blue-400">
        <div>
          <p className="text-white mb-2">
            Welcome {userProfile.fullName || "Guest"}!
          </p>
          <Modal.Title
            id="contained-modal-title-vcenter"
            className="text-white"
          >
            Get personalized information for building project more efficiently
          </Modal.Title>
        </div>
      </Modal.Header>

      <Modal.Body className="h-104 flex">
        <div className="w-1/3 flex flex-col items-center justify-center p-4 border-r">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt="Profile"
              className="w-60 h-60 rounded-full overflow-hidden"
            />
          ) : (
            <FaUserCircle size="100%" className="text-gray-300" />
          )}
          <button type="button" onClick={randomizeProfileImage} className="text-blue-600 my-3">Randomize avatar</button>
          <h3 className="text-xl font-semibold mb-2">Public Profile</h3>
          <div className="mb-2">
            <label htmlFor="profileImage" className="btn btn-primary mb-2">
              Choose Image
            </label>
            <input
              id="profileImage"
              type="file"
              onChange={handleImageChange}
              className="d-none"
            />
          </div>
          <button
            className="text-lg  text-blue-500 hover:text-blue-600 mb-2"
            onClick={uploadProfileImage}
          >
            Upload Image
          </button>
          <button
            className="text-lg text-gray-600 hover:text-gray-700"
            onClick={deleteProfileImage}
          >
            Delete Image
          </button>
        </div>
        {/* <div className=""> */}
        <form className="w-3/5 p-16" onSubmit={handleSubmit}>
          <h3 className="text-2xl mb-2">Set up your AI access</h3>
          <OpenAIKeyField />
          <h3 className="text-2xl mb-2">Work Experience</h3>
          <div>
            <label
              htmlFor="occupation"
              className="block text-xl font-semibold mb-2"
            >
              Occupation
            </label>
            <select
              id="occupation"
              name="occupation"
              className="mt-1 block w-full border-2 border-blue-500 shadow-sm rounded-md"
              value={fields.occupation}
              onChange={handleFieldChange("occupation")}
            >
              <option value="">Select an option</option>
              <option value="Admin">Admin</option>
              <option value="Product Manager">Product Manager</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="AI Developer">AI Developer</option>
              <option value="Other">Other (Please specify)</option>
            </select>
            {fields.occupation === "Other" && (
              <input
                type="text"
                value={customInputs.customOccupation}
                onChange={handleCustomInputChange("customOccupation")}
                placeholder="Enter your occupation"
                className="mt-1 block w-full border-2 border-blue-500 rounded-md shadow-sm"
              />
            )}
          </div>

          {/* Experience Level Dropdown */}
          <div>
            <label
              htmlFor="experienceLevel"
              className="mt-3 block text-xl font-semibold mb-2"
            >
              Experience Level
            </label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              className="mt-1 block w-full border-2 border-blue-500 shadow-sm rounded-md"
              value={fields.experienceLevel}
              onChange={handleFieldChange("experienceLevel")}
            >
              <option value="">Select an option</option>
              <option value="Junior">Intern / Trainee</option>
              <option value="Mid-Level">Junior / Entry Level</option>
              <option value="Senior">Mid-level</option>
              <option value="Lead/Manager">Lead / Manager</option>
              <option value="Senior Manager/Director">
                Senior Manager / Director
              </option>
              <option value="Executive">Executive</option>
              <option value="Other">Other (Please specify)</option>
            </select>
            {fields.experienceLevel === "Other" && (
              <input
                type="text"
                value={customInputs.experienceLevel}
                onChange={handleCustomInputChange("customExrienceLevel")}
                placeholder="Enter your experience level"
                className="mt-1 block w-full border-2 border-blue-500 rounded-md shadow-sm"
              />
            )}
          </div>

        </form>
      </Modal.Body>

      <Modal.Footer>
        <button
          onClick={() => setShowModal(false)}
          className="border border-blue-500 hover:bg-blue-500 text-blue-500 font-semibold hover:text-white py-1 px-2 hover:border-transparent rounded"
        >
          Skip
        </button>
        <button
          type="submit"
          className="border border-blue-500 bg-blue-500 text-white font-semibold py-1 px-2 rounded hover:bg-blue-600"
          onClick={handleSubmit} // Only handle form submission here
        >
          Continue
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProfileModal;
