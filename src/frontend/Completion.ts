export class Completion {
    private static classes = [
        'Armature',
        'Shape',
        'Light',
        'generator',
        'define',
        'createPoint',
        'stickTo',
        'attach',
        'sphere',
        'bake',
        'cylinder'
    ];
    getCompletions(_editor, _session, _position, _prefix, callback) {
        callback(null, Completion.classes.map((c: string) => {
            return {
                caption: c,
                value: c,
                score: 1000,
                meta: 'calder'
            };
        }));
    }
};
