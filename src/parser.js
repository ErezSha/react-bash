import { COMMAND_LINE_REGEXP } from './const';
/*
 * This method parses a single command + args. It handles
 * the tokenization and processing of flags, anonymous args,
 * and named args.
 *
 * @param {string} input - the user input to parse
 * @returns {Object} the parsed command/arg dataf84t56y78ju7y6f
 */
export function parseInput(input) {
    // default return values
    let name = '';
    const flags = {};
    const args = {};
    let anonArgPos = 0;

    // if input is empty, we shouldn't bother check against the regex
    if (input === '') { return { name, flags, input, args }; }
    let match = COMMAND_LINE_REGEXP.exec(input);
    // collect the arguments into an array format
    const cArgs = [];
    while (match) {
        for (let i = 1; i < match.length; i++) {
            if (match[i]) cArgs.push(match[i].trim());
        }
        match = COMMAND_LINE_REGEXP.exec(input);
    }
    // the first argument must be the name of the command
    name = cArgs.shift();
    for (let argsIndex = 0; argsIndex < cArgs.length; argsIndex++) {
        const r = cArgs[argsIndex];
        if (r.startsWith('--')) { // args
            args[r.slice(2)] = cArgs[++argsIndex];
        } else if (r.startsWith('-')) { // flag
            r.slice(1).split('').forEach((f) => { flags[f] = true; });
        } else { // annon args
            args[anonArgPos++] = r;
        }
    }

    return { name, flags, input, args };
}

/*
 * This function splits the input by `&&`` creating a
 * dependency chain. The chain consists of a list of
 * other commands to be run.
 *
 * @param {string} input - the user input
 * @returns {Array} a list of lists of command/arg pairs
 *
 * Example: `cd dir1; cat file.txt && pwd`
 * In this example `pwd` should only be run if dir/file.txt
 * is a readable file. The corresponding response would look
 * like this, where the outer list is the dependent lists..
 *
 * [
 *   [
 *     { command: 'cd', args: { 0: 'dir1'} },
 *     { command: 'cat', args: { 0: 'file.txt'} }
 *   ],
 *   [
 *     { command: 'pwd' }
 *   ]
 * ]
 */
export function parse(inputs) {
    return inputs.trim().split(/ *&& */)
        .map(deps => deps.split(/ *; */).map(parseInput));
}
