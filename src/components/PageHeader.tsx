interface PageHeaderProps {
    title: string;
    buttonText?: string;
    buttonAction?: () => void;
}

const PageHeader = ({ title, buttonText, buttonAction }: PageHeaderProps) => {
    return <>
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-center sm:text-left">{title}</h1>
        </div>
        {buttonText && buttonAction && (
            <button className="button button-primary mt-2 sm:mt-0 w-full sm:w-auto" onClick={buttonAction}>
                {buttonText}
            </button>
        )}
    </div>
    </>
}

export default PageHeader;