import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useUserAuth } from "./UserAuthContext";

const Home = () => {
  const { user } = useUserAuth();
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    // Navigate to the login page
    navigate("/");
  };

  return (
    <>
      <div className="p-4 box mt-3 text-center">
        Thank you for visiting! <br />
        {user && user.email}
      </div>
      {!user && (
        <div className="d-flex justify-center">
          <button
            onClick={handleLoginRedirect}
            className="border border-blue-500 hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 hover:border-transparent rounded"
          >
            Log In
          </button>
        </div>
      )}
    </>
  );
};

export default Home;
