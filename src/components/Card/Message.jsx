import React, { useRef, useState, useEffect } from "react";
import useMyStore from "../../contexts/projectContext";

export default function MessageBox({ commentId, name, time, profileImg, message }) {

    const deleteComment = useMyStore((store) => store.deleteComment);
    const [dropdownState, setDropdownState] = useState(false);
    return (
        <div className="flex items-start mb-1">
            <div className="flex flex-col w-full leading-1.5 p-1 bg-gray-400 rounded-xl">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <img className="w-8 h-8 rounded-full" src="/profile-pic.png" alt="Jese image" />
                    <span className="text-sm font-semibold text-white">{name}</span>
                    <span className="text-sm ml-auto font-normal text-gray-500">{time}</span>
                </div>
                <p className="text-sm font-normal py-2.5 text-white">{message}</p>
                {/* <span className="text-sm font-normal text-gray-500 dark:text-gray-400">Delivered</span> */}
            </div>
            <div className="relative right-4"> {/* Add this wrapper with a relative position */}
                <button
                    onClick={() => { setDropdownState(!dropdownState) }}
                    id="dropdownMenuIconButton" data-dropdown-toggle="dropdownDots" data-dropdown-placement="bottom-start" className="inline-flex items-center p-2 text-sm font-medium text-center text-gray-900 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:ring-gray-600" type="button">
                    <svg className="w-1 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 4 15">
                        <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                    </svg>
                </button>
                {
                    dropdownState && (
                        <div id="dropdownDots" className={`absolute right-0 z-30 bg-white divide-y divide-gray-100 rounded-lg shadow w-40 dark:bg-gray-700 dark:divide-gray-600`}>
                            <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownMenuIconButton">
                                <li>
                                    <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Reply</button>
                                </li>
                                <li>
                                    <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Forward</button>
                                </li>
                                <li>
                                    <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Copy</button>
                                </li>
                                <li>
                                    <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Report</button>
                                </li>
                                <li>
                                    <button onClick={()=>{deleteComment(commentId);}} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Delete</button>
                                </li>
                            </ul>
                        </div>
                    )
                }
            </div>
        </div>
    );
}