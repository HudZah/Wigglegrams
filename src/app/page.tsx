"use client";

import "./styles.css";
import React, { useState } from "react";
import { Loader2 } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";

import GIF from "gif.js";
import ReactImageMagnifier from "simple-image-magnifier/react";

import { Card, CardContent } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
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
) => {
    const refPoint = points[0];
    const transformedImages = images.map((imageSrc, index) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = img.width;
                canvas.height = img.height;

                console.log("Image", index, img.width, img.height);

                const selectedPoint = points[index];
                const dx = refPoint.x - selectedPoint.x;
                const dy = refPoint.y - selectedPoint.y;
                console.log("New Point for ", index, dx, dy);

                if (ctx) {
                    ctx.translate(dx, dy);
                    ctx.drawImage(img, 0, 0);
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                const dataUrl = canvas.toDataURL("image/png");
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error("Image loading failed"));
            img.src = imageSrc;
        });
    });
    console.log("transformedImages", transformedImages);
    Promise.all(transformedImages).then(async (dataUrls) => {
        console.log("Aligned Images:", dataUrls);
        await createGif(dataUrls as string[]);
    });
    async function createGif(images: string[]) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(
                    "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js"
                );
                if (!response.ok)
                    throw new Error("Network response was not OK");
                const workerBlob = await response.blob();

                // @ts-ignore
                const firstImage = new Image();
                firstImage.src = images[0];
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

                for (let i = 0; i < images.length; i++) {
                    const img = new Image();
                    img.src = images[i];
                    await new Promise((resolve) => setTimeout(resolve, 1));
                    gif.addFrame(img, { delay: 100 });
                }
                // backwards loop
                for (let i = images.length - 2; i > 0; i--) {
                    const img = new Image();
                    img.src = images[i];
                    await new Promise((resolve) => setTimeout(resolve, 1));
                    gif.addFrame(img, { delay: 100 });
                }

                gif.on("start", () => {
                    console.log("GIF started");
                });

                gif.on("progress", (progress: number) => {
                    console.log("progress", progress);
                });

                gif.on("finished", function (blob: Blob) {
                    console.log("GIF finished");
                    const url = URL.createObjectURL(blob);
                    window.open(url);
                    console.log("GIF saved at:", url);
                    resolve(url);
                    setIsGenerating(false);
                });

                gif.render();
            } catch (error) {
                console.error("Failed to create GIF", error);
                setIsGenerating(false);
                reject(error);
            }
        });
    }
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

    React.useEffect(() => {
        console.log("isGenerating changed:", isGenerating);
        if (!isGenerating) {
            return;
        }
        const generateAsync = async () => {
            await generate(originalImages, points, setIsGenerating);
        };
        generateAsync();
    }, [isGenerating]);

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
                    ctx.drawImage(imgElement, 0, 0);
                    ctx.fillStyle = "red";
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
            <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Wigglegrams
                        </h2>
                        <p className="text-muted-foreground">
                            Create wigglegrams in just a few clicks. Upload a
                            minimum of 3 images to get started.
                        </p>
                    </div>
                </div>
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
                                    <Card>
                                        <CardContent className="flex aspect-square items-center justify-center p-1">
                                            {imageSrc ===
                                            "placeholder_image_src" ? (
                                                <div className="flex aspect-square items-center justify-center w-full h-full">
                                                    <span className="text-4xl font-semibold">
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
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <ReactImageMagnifier
                                                        srcPreview={imageSrc}
                                                        srcOriginal={imageSrc}
                                                        width="100%"
                                                        height="100%"
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
                {Array(images.length)
                    .fill(null)
                    .map((_, index) => (
                        <span
                            key={index}
                            className={`inline-block mx-1 rounded-full ${
                                index + 1 === current
                                    ? "bg-primary"
                                    : "bg-gray-300"
                            } w-3 h-3`}
                        ></span>
                    ))}
            </div>
            <div className="flex justify-center my-8 space-x-6">
                <div className="w-full max-w-[16rem] flex justify-between space-x-4">
                    <Button
                        className="flex-1"
                        variant={"secondary"}
                        onClick={() =>
                            images.length > 0
                                ? reset(setImages, setCarouselLength, setPoints)
                                : upload(
                                      setImages,
                                      setOriginalImages,
                                      setCarouselLength,
                                      toast
                                  )
                        }
                    >
                        {images.length > 0 ? "Reset" : "Upload"}
                    </Button>
                    <Dialog>
                        {points.filter((point) => point !== undefined)
                            .length === images.length ? (
                            <DialogTrigger asChild>
                                <Button className="flex-1">Generate</Button>
                            </DialogTrigger>
                        ) : (
                            <Button
                                className="flex-1"
                                onClick={() =>
                                    toast({
                                        title:
                                            "Minimum " +
                                            images.length +
                                            " points required",
                                        variant: "destructive",
                                        description:
                                            "Please add a point to each image.",
                                    })
                                }
                            >
                                Generate
                            </Button>
                        )}
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
                </div>
            </div>
        </>
    );
}
