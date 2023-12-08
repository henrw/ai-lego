import React, { useCallback, usecallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { withRouter } from "./withRouter";
import app from "../firebase";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { AuthContext } from "./Auth";
import { useContext } from "react";

const Login = () => {
    const navigate = useNavigate();

    const handleLogin = useCallback(async event => {
        event.preventDefault();
        const { email, password } = event.target.elements;

        const auth = getAuth();
        signInWithEmailAndPassword(auth, email.value, password.value)
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

    const { currentUser } = useContext(AuthContext);

    if (currentUser) {
        return <Navigate to="/" replace />
    }

    return (
        <div className="flex h-[calc(100vh-112px)]">
            <div className="m-auto flex flex-col items-center ">
                <div className="text-xl font-bold m-2">Login</div>
                <form onSubmit={handleLogin}>
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
                            <button type="submit" className="bg-gray-300 my-2 w-20 p-1 rounded-lg">Login</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default withRouter(Login);