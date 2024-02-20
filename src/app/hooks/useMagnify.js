import { useEffect } from "react";

const useMagnify = (imgRef, zoom) => {
    useEffect(() => {
        if (!imgRef.current) return;

        const img = imgRef.current;
        let glass, w, h, bw;

        // Create magnifier glass
        glass = document.createElement("DIV");
        glass.setAttribute("class", "img-magnifier-glass");
        img.parentElement.insertBefore(glass, img);

        // Set background properties for the magnifier glass
        glass.style.backgroundImage = `url('${img.src}')`;
        glass.style.backgroundRepeat = "no-repeat";
        glass.style.backgroundSize = `${img.width * zoom}px ${
            img.height * zoom
        }px`;
        bw = 3;
        w = glass.offsetWidth / 2;
        h = glass.offsetHeight / 2;

        // Event listener for moving the magnifier
        const moveMagnifier = (e) => {
            e.preventDefault();
            const pos = getCursorPos(e);
            let x = pos.x;
            let y = pos.y;

            // Prevent the magnifier glass from being positioned outside the image
            x = Math.max(w / zoom, Math.min(x, img.width - w / zoom));
            y = Math.max(h / zoom, Math.min(y, img.height - h / zoom));

            // Set the position of the magnifier glass
            glass.style.left = `${x - w}px`;
            glass.style.top = `${y - h}px`;

            // Display what the magnifier glass "sees"
            glass.style.backgroundPosition = `-${x * zoom - w + bw}px -${
                y * zoom - h + bw
            }px`;
        };

        // Calculate cursor's position relative to the image
        const getCursorPos = (e) => {
            const a = img.getBoundingClientRect();
            let x = e.pageX - a.left;
            let y = e.pageY - a.top;
            x -= window.pageXOffset;
            y -= window.pageYOffset;
            return { x, y };
        };

        // Attach event listeners
        glass.addEventListener("mousemove", moveMagnifier);
        img.addEventListener("mousemove", moveMagnifier);
        glass.addEventListener("touchmove", moveMagnifier);
        img.addEventListener("touchmove", moveMagnifier);

        // Cleanup function
        return () => {
            glass.removeEventListener("mousemove", moveMagnifier);
            img.removeEventListener("mousemove", moveMagnifier);
            glass.removeEventListener("touchmove", moveMagnifier);
            img.removeEventListener("touchmove", moveMagnifier);
            glass.parentElement.removeChild(glass);
        };
    }, [imgRef, zoom]);
};

export default useMagnify;
