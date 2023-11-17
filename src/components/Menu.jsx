
import React from 'react';

const Menu = () => {
    return (
        <div className='flex flex-col items-center'>
            <div className='m-4 flex flex-col items-center'>
                <img src="/profile_pic.svg" width={150} alt='profile' />
                <p className='text-lg'>Product Managers</p>
                <p className='italic text-gray-500'>Permission: Edit/Review</p>
            </div>
            <div className='mx-6'>
                <div className='my-6'>
                    <p className='font-bold text-lg'>Team Members:</p>
                    <div className='flex flex-row'>
                        <img src="/profile_pic.svg" width={50} alt='profile' className='m-1' />
                        <div className='flex flex-col align-left m-1'>
                            <p>[Data Scientist] Steven Lee</p>
                            <p className='text-gray-500'>Data Aquisition - 1h ago</p>
                        </div>
                    </div>
                    <div className='flex flex-row'>
                        <img src="/profile_pic.svg" width={50} alt='profile' className='m-1' />
                        <div className='flex flex-col align-left m-1'>
                            <p>[Data Scientist] Steven Lee</p>
                            <p className='text-gray-500'>Data Aquisition - 1h ago</p>
                        </div>
                    </div>
                </div>
                <div className='my-6'>
                    <p className='font-bold text-lg'>Terminologies:</p>
                    <div className='flex flex-row my-2'>
                        <div className='w-1/3 mr-auto'>Voice-activated</div>
                        <p className='w-3/5'>System or technology that can be controlled or interacted with using spoken language.</p>
                    </div>
                </div>
                <div className='my-6'>
                    <p className='font-bold text-lg'>Terminologies:</p>
                    <div className='flex flex-row my-2'>
                        <div className='w-1/3 mr-auto'>Voice-activated</div>
                        <p className='w-3/5'>System or technology that can be controlled or interacted with using spoken language.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Menu;