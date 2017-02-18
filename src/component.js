import React, { Component, PropTypes } from 'react';
import * as BaseCommands from './commands';
import Bash from './bash';
import Styles from './styles';

const L_CHAR_CODE = 76;
const C_CHAR_CODE = 67;
const UP_CHAR_CODE = 38;
const DOWN_CHAR_CODE = 40;
const TAB_CHAR_CODE = 9;
const noop = () => {};

export default class Terminal extends Component {

    constructor({ history, structure, extensions, prefix }) {
        super();
        this.Bash = new Bash(extensions);
        this.ctrlPressed = false;
        this.state = {
            settings: { user: { username: prefix.split('@')[1] } },
            history: history.slice(),
            structure: Object.assign({}, structure),
            cwd: '',
            tabPressed: false,
        };
        this.handleCtrlDown = this.handleCtrlDown.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleTabPress = this.handleTabPress.bind(this);
    }

    componentDidMount() {
        this.refs.input.focus();
    }

    componentWillReceiveProps({ extensions, structure, history }) {
        const updatedState = {};
        if (structure) {
            updatedState.structure = Object.assign({}, structure);
        }
        if (history) {
            updatedState.history = history.slice();
        }
        if (extensions) {
            this.Bash.commands = Object.assign({}, extensions, BaseCommands);
        }
        this.setState(updatedState);
    }

    /*
     * Utilize immutability
     */
    shouldComponentUpdate(nextProps, nextState) {
        return (this.state !== nextState) || (this.props !== nextProps);
    }

    /*
     * Keep input in view on change
     */
    componentDidUpdate() {
        this.refs.input.scrollIntoView();
    }

    /*
     * Forward the input along to the Bash autocompleter. If it works,
     * update the input.
     */
    attemptAutocomplete() {
        const input = this.refs.input.value;
        const suggestion = this.Bash.autocomplete(input, this.state);
        if (suggestion) {
            this.refs.input.value = suggestion;
        }
    }

    handleCtrlDown(keyCode) {
        if (keyCode === L_CHAR_CODE) {
            this.setState(this.Bash.execute('clear', this.state));
        } else if (keyCode === C_CHAR_CODE) {
            this.refs.input.value = '';
        }
    }

    handleTabPress() {
        this.setState({ tabPressed: true });
        this.attemptAutocomplete();
    }

    /*
     * Handle keydown for special hot keys. The tab key
     * has to be handled on key down to prevent default.
     * @param {Event} evt - the DOM event
     */
    handleKeyDown(evt) {
        const { which, ctrlKey } = evt;
        if (evt.which !== TAB_CHAR_CODE) this.setState({ tabPressed: false });
        if (ctrlKey) {
            evt.preventDefault();
            this.handleCtrlDown(which);
        } else if (which === UP_CHAR_CODE) {
            this.refs.input.value = this.Bash.getPrevCommand();
        } else if (evt.which === DOWN_CHAR_CODE) {
            this.refs.input.value = this.Bash.getNextCommand() || '';
        } else if (evt.which === TAB_CHAR_CODE) {
            evt.preventDefault();
            this.handleTabPress();
        }
    }

    handleSubmit(evt) {
        evt.preventDefault();

        // Execute command
        const input = evt.target[0].value;
        const newState = this.Bash.execute(input, this.state);
        this.setState(newState);
        this.refs.input.value = '';
    }

    renderHistoryItem(style) {
        return (item, key) => {
            const prefix = item.hasOwnProperty('cwd') ? (
                <span style={style.prefix}>{`${this.props.prefix} ~${item.cwd} $`}</span>
            ) : undefined;
            return <div data-test-id={`history-${key}`} key={key} >{prefix}{item.value}</div>;
        };
    }

    render() {
        const { onClose, onExpand, onMinimize, prefix, theme } = this.props;
        const { history, cwd } = this.state;
        const style = Styles[theme] || Styles.light;
        return (
            <div className="ReactBash" style={style.ReactBash}>
                <div style={style.header}>
                    <span style={style.redCircle} onClick={onClose}></span>
                    <span style={style.yellowCircle} onClick={onMinimize}></span>
                    <span style={style.greenCircle} onClick={onExpand}></span>
                </div>
                <div style={style.body} onClick={() => this.refs.input.focus()}>
                    {history.map(this.renderHistoryItem(style))}
                    <form onSubmit={evt => this.handleSubmit(evt)} style={style.form}>
                        <span style={style.prefix}>{`${prefix} ~${cwd} $`}</span>
                        <input autoComplete="off" onKeyDown={this.handleKeyDown} ref="input" style={style.input} />
                    </form>
                </div>
            </div>
        );
    }
}

Terminal.Themes = {
    LIGHT: 'light',
    DARK: 'dark',
};

Terminal.propTypes = {
    extensions: PropTypes.object,
    history: PropTypes.array,
    onClose: PropTypes.func,
    onExpand: PropTypes.func,
    onMinimize: PropTypes.func,
    prefix: PropTypes.string,
    structure: PropTypes.object,
    theme: PropTypes.string,
};

Terminal.defaultProps = {
    extensions: {},
    history: [],
    onClose: noop,
    onExpand: noop,
    onMinimize: noop,
    prefix: 'hacker@default',
    structure: {},
    theme: Terminal.Themes.LIGHT,
};
