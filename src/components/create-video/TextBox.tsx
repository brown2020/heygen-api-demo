import * as fabric from 'fabric';
import { fontFamilies } from './utils';
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, LucideIcon, Strikethrough, Underline } from 'lucide-react';
import textBox1 from "@/assets/images/text-box-1.png";
import textBox2 from "@/assets/images/text-box-2.png";
import textBox3 from "@/assets/images/text-box-3.png";
import textBox4 from "@/assets/images/text-box-4.png";
import Image from 'next/image';
import { StaticImageData } from 'next/image';
import { TextGroup1, TextGroup2, TextGroup3, TextGroup4 } from './TextGroupStyle';
import { useEffect, useState } from 'react';

interface TextBoxProps {
    handleText: (textType: string) => void;
    canvas: fabric.Canvas | null;
}

interface TextStyle {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    [key: string]: boolean;
}

interface TextAlignOption {
    value: 'left' | 'center' | 'right';
    icon: LucideIcon;
    label: string;
    styles: (textAlign: string) => string;
}

interface TextAlignConfig {
    label: string;
    options: TextAlignOption[];
}

interface TextStyleOption {
    value: "underline" | "strikethrough" | "bold" | "italic";
    icon: LucideIcon;
    label: string;
    styles: (textStyle: { [key: string]: boolean }) => string;
}

interface TextStyleConfig {
    label: string;
    options: TextStyleOption[];
}

interface TextBox {
    id: number;
    onClick: (canvas: fabric.Canvas | null) => void;
    src: StaticImageData;
    alt: string;
  }

export default function TextBox({ handleText, canvas }: TextBoxProps) {
    const [color, setColor] = useState("#000000");
    const [fontSize, setFontSize] = useState(16);
    const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
    const [selectedFont, setSelectedFont] = useState('');
    const [textAlign, setTextAlign] = useState<'center' | 'left' | 'right'>('center');
    const [textStyle, setTextStyle] = useState<TextStyle>({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
    });

    useEffect(() => {
        if (canvas) {
            canvas.on('selection:created', (event) => {
                setSelectedObject(event.selected[0]);
                setFontSize((event.selected[0] as fabric.IText).fontSize ? (event.selected[0] as fabric.IText).fontSize : 16);
                setColor((event.selected[0] as fabric.IText).fill?.toString() || "#000000");
                setSelectedFont((event.selected[0] as fabric.IText).fontFamily || '');
                setTextStyle({
                    bold: (event.selected[0] as fabric.IText).fontWeight === 'bold',
                    italic: (event.selected[0] as fabric.IText).fontStyle === 'italic',
                    underline: (event.selected[0] as fabric.IText).underline || false,
                    strikethrough: (event.selected[0] as fabric.IText).linethrough || false,
                });
            });

            canvas.on('selection:updated', (event) => {
                setSelectedObject(event.selected[0]);
                setFontSize((event.selected[0] as fabric.IText).fontSize ? (event.selected[0] as fabric.IText).fontSize : 16);
                setColor((event.selected[0] as fabric.IText).fill?.toString() || "#000000");
                setSelectedFont((event.selected[0] as fabric.IText).fontFamily || '');
                setTextStyle({
                    bold: (event.selected[0] as fabric.IText).fontWeight === 'bold',
                    italic: (event.selected[0] as fabric.IText).fontStyle === 'italic',
                    underline: (event.selected[0] as fabric.IText).underline || false,
                    strikethrough: (event.selected[0] as fabric.IText).linethrough || false,
                });
            });

            canvas.on('selection:cleared', () => {
                setSelectedObject(null);
                clearSettings();
            });

            canvas.on('object:modified', (event) => { setSelectedObject(event.target) });
            canvas.on('object:scaling', (event) => { handleObjectSelection(event.target) });
            canvas.renderAll();
        }
    }, [canvas]);

    const textAlignOptions: TextAlignConfig = {
        label: "Text Alignment",
        options: [
            {
                value: 'left',
                icon: AlignLeft,
                label: 'Left',
                styles: (textAlign: string) =>
                    textAlign === 'left' ? 'bg-slate-600 text-white' : 'bg-white text-black',
            },
            {
                value: 'center',
                icon: AlignCenter,
                label: 'Center',
                styles: (textAlign: string) =>
                    textAlign === 'center' ? 'bg-slate-600 text-white' : 'bg-white text-black',
            },
            {
                value: 'right',
                icon: AlignRight,
                label: 'Right',
                styles: (textAlign: string) =>
                    textAlign === 'right' ? 'bg-slate-600 text-white' : 'bg-white text-black',
            },
        ]
    };

    const textStyleConfig: TextStyleConfig = {
        label: "Font Style",
        options: [
            {
                value: "underline",
                icon: Underline,
                label: "Underline",
                styles: (textStyle) =>
                    textStyle.underline ? "bg-slate-600 text-white" : "bg-white text-black",
            },
            {
                value: "strikethrough",
                icon: Strikethrough,
                label: "Strikethrough",
                styles: (textStyle) =>
                    textStyle.strikethrough ? "bg-slate-600 text-white border-transparent" : "bg-white text-black",
            },
            {
                value: "bold",
                icon: Bold,
                label: "Bold",
                styles: (textStyle) =>
                    textStyle.bold ? "bg-slate-600 text-white border-transparent" : "bg-white text-black",
            },
            {
                value: "italic",
                icon: Italic,
                label: "Italic",
                styles: (textStyle) =>
                    textStyle.italic ? "bg-slate-600 text-white border-transparent" : "bg-white text-black",
            },
        ],
    };

    const textBoxes : TextBox[] = [
        {
          id: 1,
          onClick: (canvas) => TextGroup1(canvas),
          src: textBox1,
          alt: "Text Box 1"
        },
        {
          id: 2,
          onClick: (canvas) => TextGroup2(canvas),
          src: textBox2,
          alt: "Text Box 2"
        },
        {
          id: 3,
          onClick: (canvas) => TextGroup3(canvas),
          src: textBox3,
          alt: "Text Box 3"
        },
        {
          id: 4,
          onClick: (canvas) => TextGroup4(canvas),
          src: textBox4,
          alt: "Text Box 4"
        },
      ];

    const handleObjectSelection = (object: fabric.Object) => {
        if (!object) return;
        if (object.type === "i-text") {
            setColor(object.fill ? object.fill.toString() : "#000000");
            setFontSize((object as fabric.IText).fontSize ? (object as fabric.IText).fontSize : 16);
            setSelectedFont((object as fabric.IText).fontFamily || '');
            setTextStyle({
                bold: (object as fabric.IText).fontWeight === 'bold',
                italic: (object as fabric.IText).fontStyle === 'italic',
                underline: (object as fabric.IText).underline || false,
                strikethrough: (object as fabric.IText).linethrough || false,
            });
            setTextAlign(((object as fabric.IText).textAlign as 'left' | 'center' | 'right'));
        }
    };

    const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setColor(value);

        if (selectedObject && canvas) {
            selectedObject.set({ fill: value });
            canvas.renderAll();
        }
    };

    const handleTextSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = parseInt(event.target.value);
        setFontSize(value);

        if (selectedObject && canvas) {
            selectedObject.set({ fontSize: value });
            canvas.renderAll();
        }
    };

    const handleFontFamilyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setSelectedFont(value);

        if (selectedObject && canvas) {
            selectedObject.set({ fontFamily: value });
            canvas.renderAll();
        }
    };

    const handleTextStyleToggle = (style: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
        const updatedStyle = { ...textStyle, [style]: !textStyle[style] };
        setTextStyle(updatedStyle);

        if (selectedObject && canvas) {
            selectedObject.set({
                fontWeight: updatedStyle.bold ? 'bold' : 'normal',
                fontStyle: updatedStyle.italic ? 'italic' : 'normal',
                underline: updatedStyle.underline,
                linethrough: updatedStyle.strikethrough ? 'line-through' : '',
            });
            canvas.renderAll();
            selectedObject.set({ width: 300 });
            canvas.renderAll();
            canvas.discardActiveObject();
            canvas.renderAll();
            canvas.setActiveObject(selectedObject);
            canvas.renderAll();
        }
    };

    const handleTextAlign = (align: 'center' | 'left' | 'right') => {
        setTextAlign(align);

        if (selectedObject && canvas) {
            if (selectedObject instanceof fabric.Text || selectedObject instanceof fabric.IText) {
                selectedObject.set({ textAlign: align });
                selectedObject.set({ width: 300 });
                canvas.renderAll();
                canvas.discardActiveObject();
                canvas.renderAll();
                canvas.setActiveObject(selectedObject);
                canvas.renderAll();
            }
        }
    };

    const clearSettings = () => {
        setColor("#000000");
        setFontSize(16);
        setTextStyle({
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
        });
        setTextAlign('center');
    };

    return (
        <div>
            {selectedObject && selectedObject.type === 'i-text' ? (
                <div className="flex flex-col gap-4 p-2 border rounded-md mb-2">
                    <div className="flex items-center justify-between gap-2">
                        <p className="block text-sm font-medium text-gray-500 mb-2">Font Size</p>
                        <select
                            id="font-size"
                            value={fontSize}
                            onChange={handleTextSizeChange}
                            className="p-2 border border-neutral-300 rounded-md w-20"
                        >
                            {Array.from({ length: 100 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {i + 1}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <p className="block text-sm font-medium text-gray-500 mb-2">Text Color</p>
                        <input
                            id="color-picker"
                            type="color"
                            value={color}
                            onChange={handleColorChange}
                            className="w-20 h-10 rounded-md cursor-pointer"
                        />
                    </div>
                    <div className="w-full max-h-36">
                        <label className="block text-sm font-medium text-gray-500 mb-2">Select Font Family</label>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedFont}
                            onChange={handleFontFamilyChange}
                        >
                            <option value="">Select a font</option>
                            {fontFamilies.map((font, index) => (
                                <option key={index} value={font} style={{ fontFamily: font }}>
                                    {font}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">
                            {textAlignOptions.label}
                        </label>
                        <div className="flex gap-5">
                            {textStyleConfig.options.map((option) => (
                                <div
                                    key={option.value}
                                    className={`cursor-pointer border rounded-md p-1 ${option.styles(textStyle)}`}
                                    onClick={() => handleTextStyleToggle(option.value)}
                                >
                                    <option.icon size={24} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">
                            {textAlignOptions.label}
                        </label>
                        <div className="flex gap-5">
                            {textAlignOptions.options.map((option) => (
                                <div
                                    key={option.value}
                                    className={`cursor-pointer border rounded-md p-1 ${option.styles(textAlign)}`}
                                    onClick={() => handleTextAlign(option.value)}
                                >
                                    <option.icon size={24} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex flex-col gap-2">
                        <button
                            className="w-full text-start pl-2 rounded-md bg-neutral-200 py-2 text-2xl font-semibold text-neutral-800 hover:bg-neutral-300 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => handleText('headline')}
                        >
                            Add a headline
                        </button>
                        <button
                            className="w-full text-start pl-2 rounded-md bg-neutral-200 py-2 text-lg font-semibold text-neutral-800 hover:bg-neutral-300 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => handleText('subTitle')}
                        >
                            Add a subtitle
                        </button>
                        <button
                            className="w-full text-start pl-2 rounded-md bg-neutral-200 py-2 text-sm hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => handleText('body')}
                        >
                            Add a body
                        </button>
                    </div>
                    <div className='mt-5 grid grid-cols-3 gap-2 justify-items-center'>
                        {textBoxes.map((textBox) => (
                            <div
                                key={textBox.id}
                                onClick={() => textBox.onClick(canvas)}
                                className='border bg-white rounded-md cursor-pointer'
                            >
                                <Image src={textBox.src} alt={textBox.alt} height={100} width={100}/>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
