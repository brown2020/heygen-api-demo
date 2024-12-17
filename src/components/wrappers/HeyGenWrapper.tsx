"use client";

import useProfileStore from "@/zustand/useProfileStore";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter
  } from "@nextui-org/modal";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, createElement } from "react";

function HeyGenDetailStep1 () {
    return <><h3 className="text-lg font-semibold text-gray-800 mb-2">Step 1: Guide to Generate API Key</h3>
    <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-4">
        <li>
            <strong>Create a HeyGen account:</strong> &nbsp;
            <a href="https://app.heygen.com/login" target="_blank" className="text-blue-600 hover:underline">Go to HeyGen</a>
            . After you create a HeyGen account, you are able to make professional avatar videos by leveraging HeyGen&apos;s powerful AI capabilities.
        </li>
        <li><strong>Navigate to API Keys:</strong> After you have registered the HeyGen account, proceed to your account settings and scroll down to the API section and copy your API token.</li>
        <li><strong>Copy Your API Key:</strong> Once generated, copy the API key provided.</li>
    </ol></>;
}
function HeyGenDetailStep2 () {
    return <><h3 className="text-lg font-semibold text-gray-800 mb-2">Step 2: Add API Key to Your Profile</h3>
    <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-4">
        <li><strong>Go to Your Profile Settings:</strong> Click on your profile icon and select &quot;Profile&quot;.</li>
        <li><strong>Locate the API Key Field:</strong> Find the &quot;Heygen API Key&quot; section.</li>
        <li><strong>Paste Your API Key:</strong> Paste the copied key into the input field.</li>
        <li><strong>Save Your Changes:</strong> Click &quot;Save&quot; to update your profile.</li>
    </ol>
</>;
}
function HeyGenDetailStep3 () {
    return <><h3 className="text-lg font-semibold text-gray-800 mb-2">Step 3: Confirm the API Key</h3>
            <p className="text-gray-700 mb-4">Once added, you’re all set! If you face any issues, verify the key is copied correctly and active in the Heygen Developer Portal.</p></>;
}

export default function HeyGenWrapper({ children }: { children: React.ReactNode }){
    const router = useRouter();
    
    const [step, setStep] = useState(0);
    const [showModal, setShowModal] = useState(false);

    const profile = useProfileStore(state => state.profile);

    const heyGenAPIKey = useMemo(() => profile ? profile.heygen_api_key : null, [profile]);

    useEffect(() => {
        setShowModal(heyGenAPIKey == null || heyGenAPIKey ? false : true);
    }, [heyGenAPIKey])

    const steps = [
        HeyGenDetailStep1,
        HeyGenDetailStep2,
        HeyGenDetailStep3,
    ];

    const goToProfile = () => {
        router.push('/profile')
    }

    return <>
    {!heyGenAPIKey ? <>
     <Modal size="lg" isOpen={showModal} onClose={() => {setShowModal(false)}}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl">Add Your Heygen API Key</h2>
          <div className="text-sm text-gray-600 font-light">To get started with Heygen services, please add your Heygen API Key.</div>
          </ModalHeader>
          <ModalBody>
            <div>
                {
                    step <= (steps.length - 1) ? createElement(steps[step]) : <></> 
                }
            </div>
          </ModalBody>
          <ModalFooter>
            {
                step > 0 ? <button color="primary" onClick={() => { setStep(step - 1) }} >
                    Previous
                </button> : <></>
            }
            {
                step == (steps.length - 1) ? <button color="primary" onClick={goToProfile} >
                Finish
              </button> : <></>
            }
            {
                step < (steps.length - 1) ? <button color="primary" onClick={() => { setStep(step + 1) }} >
                Next
              </button> : <></>
            }
          </ModalFooter>
        </ModalContent>
      </Modal></> : <></>}
      <>{children}</>
    </>
}
