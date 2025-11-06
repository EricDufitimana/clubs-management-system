export default function HeaderParagraph({headerText, paragraphText}){
    return (
        <>
            <h1 className="header-1">{headerText}</h1>
            <p className="paragraph-1 mt-2">{paragraphText}</p>

        </>
    )
}