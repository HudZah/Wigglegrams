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
    setSelectedImages: React.Dispatch<React.SetStateAction<Set<number>>>
) => {
    setImages([]);
    setCarouselLength(3);
    setSelectedImages(new Set());
};

export default function Home() {
    const [images, setImages] = React.useState<string[]>([]);
    const [carouselLength, setCarouselLength] = React.useState<number>(3);
    const [api, setApi] = React.useState<CarouselApi | null>(null);
    const [selectedImages, setSelectedImages] = useState<Set<number>>(
        new Set()
    );
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

    const handleImageClick = (index: number) => {
        setSelectedImages((prevSelectedImages) => {
            const newSelectedImages = new Set(prevSelectedImages);
            if (newSelectedImages.has(index)) {
                newSelectedImages.delete(index);
            } else {
                newSelectedImages.add(index);
            }
            return newSelectedImages;
        });
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
                            Create wigglegrams in just a few clicks
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex justify-center items-center h-[60%]">
                <Carousel setApi={setApi} className="w-full max-w-[32rem]">
                    <CarouselContent>
                        {images.map((imageSrc, index) => (
                            <CarouselItem
                                key={index}
                                onClick={() => handleImageClick(index)}
                            >
                                <div className="p-1 relative">
                                    <Card>
                                        <CardContent className="flex aspect-square items-center justify-center p-1">
                                            <ReactImageMagnifier
                                                srcPreview={imageSrc}
                                                srcOriginal={imageSrc}
                                                width="100%"
                                                height="100%"
                                            />
                                        </CardContent>
                                    </Card>
                                    {selectedImages.has(index) && (
                                        <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center">
                                            <div className="text-red-500 text-4xl">
                                                ✖
                                            </div>
                                        </div>
                                    )}
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
                                ? reset(
                                      setImages,
                                      setCarouselLength,
                                      setSelectedImages
                                  )
                                : upload(setImages, setCarouselLength, toast)
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
