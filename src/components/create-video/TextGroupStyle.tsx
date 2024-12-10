import * as fabric from 'fabric';

function fabricText(text: string, style: object ) {
    return new fabric.IText(text, style);
}

function fabricGroup(canvas: fabric.Canvas | null, group: fabric.Group) {
    if (!canvas) return;
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    canvas.on('selection:cleared', () => {
        const items = group.getObjects();
        group.remove(...items);
        items.forEach((item: fabric.Object) => {
            item.set({ selectable: true });
            canvas.add(item);
        });

        canvas.remove(group);
        canvas.renderAll();
    });
}

export const TextGroup1 = (canvas: fabric.Canvas | null) => {
    if (!canvas) return;

    const set1 = fabricText('Life is an', {
        left: 100,
        top: 100,
        fontSize: 22,
        fill: 'black',
        fontWeight: 'bold',
    });
    const set2 = fabricText('Adventure', {
        left: 80,
        top: 140,
        fontSize: 38,
        fill: 'black',
        fontFamily: 'Rock Salt',
        fontStyle: 'italic',
    });

    const group = new fabric.Group([set1, set2], {
        left: 100,
        top: 100,
        selectable: true,
    });

    fabricGroup(canvas, group);
};

export const TextGroup2 = ((canvas: fabric.Canvas | null) => {
    if (!canvas) return;

    const set1 = fabricText('Congratulations!', {
        top: 100,
        fontSize: 62,
        fill: 'black',
        fontFamily: 'Bilbo Swash Caps',
        selectable: true,
    });
    const set2 = fabricText(`You'rs a Big Brother`, {
        top: 170,
        right: 0,
        fontSize: 18,
        fill: 'black',
        align: 'right',
        width: 100,
    });

    set2.set({
        wrap: 'word',
    });
    set2.set({ left: set1.left + set1.width / 2 - set2.width / 3 });

    const group = new fabric.Group([set1, set2], {
        left: 100,
        top: 100,
        selectable: true,
    });

    fabricGroup(canvas, group);
});

export const TextGroup3 = ((canvas: fabric.Canvas | null) => {
    if (!canvas) return;

    const set1 = fabricText('The Future Of Design', {
        top: 100,
        fontSize: 18,
        fill: 'black',
        selectable: true,
    });
    const set2 = fabricText(`MINIMALISIM`, {
        top: 120,
        right: 0,
        fontSize: 62,
        fill: 'black',
        align: 'right',
    });
    const group = new fabric.Group([set1, set2], {
        left: 100,
        top: 100,
        selectable: true,
    });

    fabricGroup(canvas, group);
});

export const TextGroup4 = ((canvas: fabric.Canvas | null) => {
    if (!canvas) return;

    const set1 = fabricText('END OF SEASON', {
        top: 100,
        fontSize: 18,
        fill: 'black',
        selectable: true,
    });
    const set2 = fabricText(`SALE`, {
        top: 120,
        right: 0,
        fontSize: 56,
        fill: 'black',
        fontWidth: 'bold',
        align: 'right',
    });
    const group = new fabric.Group([set1, set2], {
        left: 100,
        top: 100,
        selectable: true,
    });

    fabricGroup(canvas, group);
});