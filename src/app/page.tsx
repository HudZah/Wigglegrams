"use client";

import "./styles.css";
import React, { useState } from "react";
import {
    Download,
    Loader2,
    BookImage,
    Wand2,
    Upload,
    Check,
    Trash2,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";

import { useToast } from "@/components/ui/use-toast";
import { Jua } from "next/font/google";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import GIF from "gif.js";

import { Card, CardContent } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageMagnifier from "../components/magnifier";

const font = Jua({
    subsets: ["latin"],
    weight: "400",
    variable: "--font-jua",
});

const upload = (
    setImages: React.Dispatch<React.SetStateAction<string[]>>,
    setOriginalImages: React.Dispatch<React.SetStateAction<string[]>>,
    setCarouselLength: React.Dispatch<React.SetStateAction<number>>,
    toast: ({
        title,
        description,
    }: {
        title: string;
        description: string;
    }) => void
) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*";
    input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;

        if (files) {
            if (files.length > 2) {
                const newImages = Array.from(files).map((file) =>
                    URL.createObjectURL(file)
                );
                setImages(newImages);
                setOriginalImages(newImages);
                setCarouselLength(newImages.length);
            } else {
                console.log("toast");
                toast({
                    title: "Minimum 3 Images Required",
                    // @ts-ignore
                    variant: "destructive",
                    description: "Please select at least 3 images to proceed.",
                });
            }
        }
    };
    input.click();
};

const reset = (
    setImages: React.Dispatch<React.SetStateAction<string[]>>,
    setCarouselLength: React.Dispatch<React.SetStateAction<number>>,
    setPoints: React.Dispatch<React.SetStateAction<{ x: number; y: number }[]>>
) => {
    setImages([]);
    setCarouselLength(3);
    setPoints([]);
};

const generate = async (
    images: string[],
    points: { x: number; y: number }[],
    setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>
): Promise<string> => {
    const refPoint = points[0];
    const transformAndCreateGif = async (): Promise<string> => {
        const transformedImages = await Promise.all(
            images.map((imageSrc, index) => {
                return new Promise<string>((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.onload = () => {
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        canvas.width = img.width;
                        canvas.height = img.height;

                        const selectedPoint = points[index];
                        const dx = refPoint.x - selectedPoint.x;
                        const dy = refPoint.y - selectedPoint.y;

                        console.log("refPoint", refPoint);
                        console.log("selectedPoint", selectedPoint);

                        console.log("dx", dx);
                        console.log("dy", dy);

                        if (ctx) {
                            ctx.translate(dx, dy);
                            ctx.drawImage(img, 0, 0);
                            ctx.setTransform(1, 0, 0, 1, 0, 0);
                        }
                        const dataUrl = canvas.toDataURL("image/png");
                        resolve(dataUrl);
                    };
                    img.onerror = () =>
                        reject(new Error("Image loading failed"));
                    img.src = imageSrc;
                });
            })
        );

        try {
            const response = await fetch(
                "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js"
            );
            if (!response.ok) throw new Error("Network response was not OK");
            const workerBlob = await response.blob();

            const firstImage = new Image();
            firstImage.src = transformedImages[0] as string;
            await new Promise((resolve) => {
                firstImage.onload = () => resolve(true);
            });

            let gif = new GIF({
                workers: 2,
                quality: 10,
                width: firstImage.width,
                height: firstImage.height,
                repeat: 0,
                workerScript: URL.createObjectURL(workerBlob),
            });

            for (let i = 0; i < transformedImages.length; i++) {
                const img = new Image();
                img.src = transformedImages[i] as string;
                await new Promise((resolve) => setTimeout(resolve, 1));
                gif.addFrame(img, { delay: 100 });
            }

            // backwards loop
            for (let i = transformedImages.length - 2; i > 0; i--) {
                const img = new Image();
                img.src = transformedImages[i] as string;
                await new Promise((resolve) => setTimeout(resolve, 1));
                gif.addFrame(img, { delay: 100 });
            }

            return new Promise<string>((resolve, reject) => {
                gif.on("finished", function (blob) {
                    resolve(URL.createObjectURL(blob));
                });

                gif.render();
            });
        } catch (error) {
            console.error("Failed to create GIF", error);
            throw error;
        }
    };

    return transformAndCreateGif()
        .then((gifUrl) => {
            // Handle the gifUrl here, e.g., display it or send it to a server
            setIsGenerating(false);
            return gifUrl;
        })
        .catch((error) => {
            console.error("Error in generating GIF", error);
            setIsGenerating(false);
            throw error;
        });
};
export default function Home() {
    const [images, setImages] = React.useState<string[]>([]);
    const [originalImages, setOriginalImages] = React.useState<string[]>([]);
    const [carouselLength, setCarouselLength] = React.useState<number>(3);
    const [api, setApi] = React.useState<CarouselApi | null>(null);
    const [points, setPoints] = React.useState<{ x: number; y: number }[]>([]);
    const [count, setCount] = React.useState(0);
    const [current, setCurrent] = React.useState(0);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [gifUrl, setGifUrl] = React.useState<string | null>(null);
    const [showDialog, setShowDialog] = React.useState(false);
    const [scaledPoints, setScaledPoints] = React.useState<
        { x: number; y: number }[]
    >([]);

    const { toast } = useToast();

    React.useEffect(() => {
        if (!api) {
            return;
        }

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            console.log("current");
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api, carouselLength]);

    const handleAddPoint = (
        event: React.MouseEvent<HTMLDivElement>,
        index: number
    ) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const pointExists = points[index] !== undefined;
        console.log("pointExists", pointExists);
        console.log("points", points);

        setPoints((prevPoints) => {
            const newPoints = [...prevPoints];
            newPoints[index] = { x, y };
            return newPoints;
        });

        if (images[index]) {
            const baseImageSrc = pointExists
                ? originalImages[index]
                : images[index];
            const imgElement = new Image();
            imgElement.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    canvas.width = imgElement.naturalWidth;
                    canvas.height = imgElement.naturalHeight;

                    const scaledX = x * (imgElement.naturalWidth / rect.width);
                    const scaledY =
                        y * (imgElement.naturalHeight / rect.height);

                    console.log("scaledX", scaledX);
                    console.log("scaledY", scaledY);

                    setScaledPoints((prevPoints) => {
                        const updatedPoints = [...prevPoints];
                        updatedPoints[index] = { x: scaledX, y: scaledY };
                        return updatedPoints;
                    });

                    ctx.drawImage(imgElement, 0, 0);
                    ctx.fillStyle = "#FF711A";
                    ctx.beginPath();
                    ctx.arc(
                        x * (imgElement.naturalWidth / rect.width),
                        y * (imgElement.naturalHeight / rect.height),
                        3,
                        0,
                        2 * Math.PI
                    );
                    ctx.fill();
                    const newImageSrc = canvas.toDataURL("image/png");
                    setImages((prevImages) => {
                        const updatedImages = [...prevImages];
                        updatedImages[index] = newImageSrc;
                        return updatedImages;
                    });
                    setIsGenerating(false);
                }
            };
            imgElement.src = baseImageSrc;
        }
    };

    return (
        <>
            <Head>
                <title>Wigglegrams</title>
                <meta
                    property="og:image"
                    content="../../public/images/banner.png"
                />
            </Head>
            <div className="flex justify-between items-center w-full p-8">
                <div>
                    <h1
                        className={
                            font.className +
                            " text-3xl font-bold tracking-tight text-primary"
                        }
                    >
                        Wigglegrams
                    </h1>
                    <p className="text-muted-foreground">
                        Create wigglegrams in just a few clicks. Upload at least
                        3 photos. Choose a point to wiggle the image around. And
                        generate! Your photos never leave your device.
                    </p>
                </div>
                <Link href="https://www.hudzah.com/photos">
                    <Button>
                        <BookImage className="mr-2 h-4 w-4" />
                        Gallery
                    </Button>
                </Link>
            </div>
            <div className="flex justify-center items-center h-[60%]">
                <Carousel setApi={setApi} className="w-full max-w-[32rem]">
                    <CarouselContent>
                        {(images.length > 0
                            ? images
                            : Array(3).fill("placeholder_image_src")
                        ).map((imageSrc, index) => (
                            <CarouselItem key={index}>
                                <div className="p-1 relative">
                                    <Card
                                    // className={
                                    //     points[index]
                                    //         ? // orange border
                                    //           "border-orange-500 border-2 rounded-lg"
                                    //         : ""
                                    // }
                                    >
                                        <CardContent className="flex aspect-square items-center justify-center p-1">
                                            {imageSrc ===
                                            "placeholder_image_src" ? (
                                                <div className="flex aspect-square items-center justify-center w-full h-full">
                                                    <span
                                                        className={`${font.className} text-4xl font-semibold`}
                                                    >
                                                        Image {index + 1}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={(event) => {
                                                        if (images.length > 0) {
                                                            handleAddPoint(
                                                                event,
                                                                index
                                                            );
                                                        }
                                                    }}
                                                    style={{
                                                        position: "relative",
                                                        cursor: "crosshair",
                                                    }}
                                                >
                                                    <ImageMagnifier
                                                        width="100%"
                                                        height="100%"
                                                        src={imageSrc}
                                                    />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>
            <div className="flex items-center justify-center h-full py-2">
                {Array(Math.max(images.length, 3))
                    .fill(null)
                    .map((_, index) => (
                        // check if theres a point for this index, if so add a filled circle with bg-primary otherwise keep the bg-gary-300. If you're on current index, add a border-primary
                        <span
                            key={index}
                            className={`inline-block mx-1 rounded-full ${
                                index + 1 === current
                                    ? "border-2 border-primary"
                                    : points[index]
                                    ? "bg-primary border-2 border-primary"
                                    : "bg-gray-300 border-2 border-gray-300"
                            } w-3 h-3`}
                        ></span>
                    ))}
            </div>
            <div className="flex justify-center my-8 space-x-6">
                <div className="w-full max-w-[16rem] flex justify-between space-x-4">
                    {!images.length ? (
                        <Button
                            className="flex-1"
                            variant={"secondary"}
                            onClick={() =>
                                images.length > 0
                                    ? reset(
                                          setImages,
                                          setCarouselLength,
                                          setPoints
                                      )
                                    : upload(
                                          setImages,
                                          setOriginalImages,
                                          setCarouselLength,
                                          toast
                                      )
                            }
                        >
                            <>
                                <Upload className="mr-2 h-4 w-4" /> Add Photos
                            </>
                        </Button>
                    ) : (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="flex-1"
                                    variant={"secondary"}
                                >
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />{" "}
                                        Reset
                                    </>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Reset Images
                                    </AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogDescription>
                                    This action will clear all selected images
                                    and points. This action cannot be undone.
                                </AlertDialogDescription>
                                <AlertDialogFooter>
                                    <AlertDialogCancel asChild>
                                        <Button variant="outline">
                                            Cancel
                                        </Button>
                                    </AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                        <Button
                                            variant="destructive"
                                            onClick={() =>
                                                reset(
                                                    setImages,
                                                    setCarouselLength,
                                                    setPoints
                                                )
                                            }
                                        >
                                            Continue
                                        </Button>
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button
                        disabled={!images.length}
                        className="flex-1"
                        onClick={() => {
                            if (
                                points.filter((point) => point !== undefined)
                                    .length === images.length
                            ) {
                                setShowDialog(true);
                            } else {
                                toast({
                                    title:
                                        "Minimum " +
                                        images.length +
                                        " points required",
                                    variant: "destructive",
                                    description:
                                        "Please add a point to each image.",
                                });
                            }
                        }}
                    >
                        <Wand2 className="mr-2 h-4 w-4" /> Generate
                    </Button>

                    <Dialog open={showDialog} onOpenChange={setShowDialog}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Generate Wigglegram</DialogTitle>
                            </DialogHeader>
                            <DialogDescription>
                                Set the frame duration in ms and click generate.
                            </DialogDescription>
                            <div className="flex flex-col space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Input
                                        id="frameDuration"
                                        type="number"
                                        defaultValue="100"
                                        placeholder="Enter Frame Duration (ms)"
                                        // TODO: add frame duration functionality
                                    />
                                </div>
                            </div>
                            <DialogFooter className="sm:justify-end">
                                <Button
                                    type="button"
                                    onClick={async () => {
                                        setIsGenerating(true);
                                        const generatedGifUrl = await generate(
                                            originalImages,
                                            scaledPoints,
                                            setIsGenerating
                                        );
                                        if (generatedGifUrl) {
                                            setGifUrl(generatedGifUrl);
                                            setShowDialog(false);
                                            // Display the generated GIF in a new dialog
                                            // toast({
                                            //     title: "Wigglegram Generated Successfully",
                                            //     description:
                                            //         "Your Wigglegram is ready to download.",
                                            //     action: (
                                            //         <Button
                                            //             onClick={() => {
                                            //                 console.log(
                                            //                     "Download"
                                            //                 );
                                            //                 const link =
                                            //                     document.createElement(
                                            //                         "a"
                                            //                     );
                                            //                 link.href =
                                            //                     generatedGifUrl;
                                            //                 link.download =
                                            //                     "wigglegram.gif"; // Provide a default filename for the download
                                            //                 document.body.appendChild(
                                            //                     link
                                            //                 );
                                            //                 link.click();
                                            //                 document.body.removeChild(
                                            //                     link
                                            //                 );
                                            //             }}
                                            //         >
                                            //             <Download
                                            //                 size={16}
                                            //                 strokeWidth={2}
                                            //             />
                                            //         </Button>
                                            //     ),
                                            // });
                                        }
                                    }}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        "Generate"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {gifUrl && !showDialog && (
                        <Dialog
                            open={!!gifUrl}
                            onOpenChange={(open) => !open && setGifUrl(null)}
                        >
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Your Wigglegram is Ready!
                                    </DialogTitle>
                                    <DialogClose />
                                </DialogHeader>
                                <DialogDescription>
                                    <div className="flex flex-col items-center justify-center">
                                        <img
                                            src={gifUrl}
                                            alt="Generated Wigglegram"
                                            className="max-w-full h-auto"
                                            style={{
                                                imageRendering: "pixelated",
                                            }}
                                        />
                                    </div>
                                </DialogDescription>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            Close
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        onClick={() => {
                                            const link =
                                                document.createElement("a");
                                            link.href = gifUrl;
                                            link.download = "wigglegram.gif";
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                    >
                                        Download
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>
        </>
    );
}
