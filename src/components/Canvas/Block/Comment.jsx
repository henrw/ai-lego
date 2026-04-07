import React, { useRef, useState, useEffect } from "react";

export default function CommentComponent({
    comment,
    handleReplyToComment,
    level = 0,
    allComments,
}) {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState("");

    const submitReply = () => {
        handleReplyToComment(comment.id, replyText);
        setReplyText("");
        setShowReplyInput(false);
    };

    // Find child comments for the current comment
    const childComments = allComments.filter((c) => c.parentId === comment.id);

    return (
        <div>
            <div className={`ml-${level * 2} mt-2 border-l-2 border-gray-300 pl-4`}>
                <div className="comment p-2">
                    <p>{comment.text}</p>
                    <button
                        className="text-blue-500 hover:text-blue-700 text-sm font-semibold"
                        onClick={() => setShowReplyInput(!showReplyInput)}
                    >
                        Reply
                    </button>
                    {showReplyInput && (
                        <div className="mt-2">
                            <textarea
                                className="no-drag w-full border border-gray-300 p-2 mb-2 rounded"
                                placeholder="Type your reply here..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            {/* <button
                  className="text-white bg-blue-500 hover:bg-blue-700 font-bold py-1 px-2 rounded text-sm"
                  onClick={submitReply}
                >
                  Post Reply
                </button> */}
                        </div>
                    )}
                </div>
                {childComments.map((childComment) => (
                    <CommentComponent
                        key={childComment.id}
                        comment={childComment}
                        handleReplyToComment={handleReplyToComment}
                        level={level + 1}
                        allComments={allComments}
                    />
                ))}
            </div>
        </div>
    );
};