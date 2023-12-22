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
      <div className="d-grid gap-2">
        <Button variant="primary" onClick={handleLoginRedirect}>
          Log In
        </Button>
      </div>
    </>
  );
};

export default Home;
