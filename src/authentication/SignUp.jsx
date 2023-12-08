import React, { useCallback, usecallback } from "react";
import { withRouter } from "../authentication/withRouter";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { Navigate, useNavigate } from "react-router-dom";
import app from "../firebase";

const SignUp = ({ history }) => {
    const navigate = useNavigate();

    const handleSignUp = useCallback(async event => {
        event.preventDefault();
        const {email, password } = event.target.elements;

        const auth = getAuth();

        console.log(email.value, password.value);
        createUserWithEmailAndPassword(auth, email.value, password.value)
            .then((userCredential) => {
                // User created
                const user = userCredential.user;
                navigate("/");
            })
            .catch((error) => {
                // Handle errors
                const errorCode = error.code;
                const errorMessage = error.message;
                // ...
            });
    }, [navigate]);

    return (
        <div className="flex h-[calc(100vh-112px)]">
            <div className="m-auto flex flex-col items-center ">
                <div className="text-xl font-bold m-2">Sign Up</div>
                <form onSubmit={handleSignUp}>
                    <div className="flex flex-col">
                        <label className="flex flex-row my-1">
                            <div className="mr-auto px-2">Email</div>
                            <input name="email" type="email" placeholder="Email" />
                        </label>
                        <label className="flex flex-row my-1">
                            <div className="mr-auto px-2">Password</div>
                            <input name="password" type="password" placeholder="Password" />
                        </label>
                        <div className="flex justify-center">
                            <button type="submit" className="bg-gray-300 my-2 w-20 p-1 rounded-lg">Sign Up</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default withRouter(SignUp);