"use client";

import "./styles.css";

import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

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

export default function Home() {
    const [images, setImages] = React.useState<string[]>([]);
    const [originalImages, setOriginalImages] = React.useState<string[]>([]);
    const [carouselLength, setCarouselLength] = React.useState<number>(3);
    const [api, setApi] = React.useState<CarouselApi | null>(null);
    const [points, setPoints] = React.useState<{ x: number; y: number }[]>([]);

    const { toast } = useToast();

    React.useEffect(() => {
        if (!api) {
            return;
        }

        api.on("select", () => {
            console.log("current");
            console.log("carouselLength", carouselLength);
        });
    }, [api, carouselLength]);

    const handleAddPoint = (
        event: React.MouseEvent<HTMLDivElement>,
        index: number
    ) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left; // x position within the element.
        const y = event.clientY - rect.top; // y position within the element.

        const pointExists = points[index] !== undefined;
        console.log("pointExists", pointExists);

        setPoints((prevPoints) => {
            const newPoints = [...prevPoints];
            newPoints[index] = { x, y };
            return newPoints;
        });

        if (images[index]) {
            // Use original image as a base if a point already exists, otherwise use the current image
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
                    ctx.fillStyle = "red"; // Set the fill color to red before drawing the circle
                    ctx.beginPath(); // Begin a new path for the circle
                    ctx.arc(
                        x * (imgElement.naturalWidth / rect.width),
                        y * (imgElement.naturalHeight / rect.height),
                        5, // Radius of the circle
                        0, // Start angle
                        2 * Math.PI // End angle (full circle)
                    );
                    ctx.fill(); // Fill the circle with the current fill style
                    ctx.strokeStyle = "red"; // Set the stroke color to red for the border
                    ctx.strokeRect(0, 0, canvas.width, canvas.height);
                    const newImageSrc = canvas.toDataURL("image/png");
                    setImages((prevImages) => {
                        const updatedImages = [...prevImages];
                        updatedImages[index] = newImageSrc;
                        return updatedImages;
                    });
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
                    <Button className="flex-1">Generate</Button>
                </div>
            </div>
        </>
    );
}
