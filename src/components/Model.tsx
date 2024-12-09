export default function Model({ children, show }: Readonly<{
    children: React.ReactNode;
    show: boolean;
}>) {

    return (
        <div className={`relative z-[99999] ${show ? "" : 'hidden'}`} >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" ></div>
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    {children}
            </div>
        </div>
    )
}