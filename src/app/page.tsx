"use client";

import * as React from "react";
import { useToast } from "@/components/ui/use-toast";

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
                    variant: "destructive",
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
    setCarouselLength: React.Dispatch<React.SetStateAction<number>>
) => {
    setImages([]);
    setCarouselLength(3);
};

export default function Home() {
    const [images, setImages] = React.useState<string[]>([]);
    const [carouselLength, setCarouselLength] = React.useState<number>(3);
    const [api, setApi] = React.useState<CarouselApi | null>(null);
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
                        {Array.from({ length: carouselLength }).map(
                            (_, index) => (
                                <CarouselItem key={index}>
                                    <div className="p-1">
                                        <Card>
                                            <CardContent className="flex aspect-square items-center justify-center p-6">
                                                <span className="text-4xl font-semibold">
                                                    {index + 1}
                                                </span>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            )
                        )}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>
            <div className="flex justify-center my-8 space-x-6">
                <Button
                    variant={"secondary"}
                    onClick={() =>
                        images.length > 0
                            ? reset(setImages, setCarouselLength)
                            : upload(setImages, setCarouselLength, toast)
                    }
                >
                    {images.length > 0 ? "Reset" : "Upload"}
                </Button>
                <Button>Generate</Button>
            </div>
        </>
    );
}
