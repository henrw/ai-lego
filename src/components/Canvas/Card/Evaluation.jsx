import React, { useRef, useState, useEffect } from "react";
import useMyStore from "../../../contexts/projectContext";

export default function EvaluationBox({ evaluationData }) {

    const { by, time, profileImg, problem, value, stakeholders, impact, open } = evaluationData;

    const [dropdownState, setDropdownState] = useState(false);
    return (
        <div className="flex items-start mb-1">
            <img className="w-8 h-8 rounded-full" src="/profile-pic.png" alt="Jese image" />
            <div className="flex flex-col w-full leading-1.5 ml-1">
                <div className="flex items-left space-x-2 text-xs">
                    {/* <span className="font-semibold">{name}</span> */}
                    <span className="font-normal text-gray-500">{time}</span>
                </div>
                <div className="relative text-sm font-normal bg-red-200 rounded p-2">
                    <div>
                        <p className="text-sm font-normal py-2.5 ">Problem: {problem}</p>
                        <p className="text-sm font-normal py-2.5 ">Value: {value}</p>
                        <p className="text-sm font-normal py-2.5 ">Stakeholders: {stakeholders}</p>
                        <p className="text-sm font-normal py-2.5 ">Impact: {impact}</p>
                        <p className="text-sm font-normal py-2.5 ">Open-ended Comment: {open}</p>
                    </div>
                    <div className="absolute top-0 right-0">
                        <button
                            onClick={() => { setDropdownState(!dropdownState) }}
                            id="dropdownMenuIconButton" data-dropdown-toggle="dropdownDots" data-dropdown-placement="bottom-start"
                            className="inline-flex items-center p-2 text-sm bg-white outline-1 font-medium text-center rounded-lg dark:text-white focus:ring-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:ring-gray-600" type="button">
                            <svg className="w-1 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 4 15">
                                <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                            </svg>
                        </button>
                        {
                            dropdownState && (
                                <div id="dropdownDots" className={`absolute right-0 z-30 bg-white divide-y divide-gray-100 rounded-lg shadow w-min dark:bg-gray-700 dark:divide-gray-600`}>
                                    <ul className="text-sm text-gray-600" aria-labelledby="dropdownMenuIconButton">
                                        <li>
                                            <button className="block px-4 py-2 w-full rounded-t-lg hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Reply</button>
                                        </li>
                                        <li>
                                            <button className="block px-4 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Forward</button>
                                        </li>
                                        <li>
                                            <button className="block px-4 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Copy</button>
                                        </li>
                                        <li>
                                            <button className="block px-4 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Report</button>
                                        </li>
                                        <li>
                                            <button className="block px-4 py-2 w-full rounded-b-lg hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Delete</button>
                                        </li>
                                    </ul>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}