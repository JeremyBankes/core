const crypto = require('crypto');

const core = {

    // Tools for manipulating data
    data: {

        /**
         * @typedef {'string'|'number'|'boolean'|'date'|'object'} ParsableType
         */

        /**
         * Retrieves a value from an object as a certain type, or returns a fallback value.
         * @param {object} source
         * @param {string} field Can specify a path to a field seperated by dots (ie person.name.first)
         * @param {ParsableType} type
         * @param {any} [fallback] Leave unspecified for required fields
         */
        get(source, field, type, fallback) {
            const path = field.split('.').reverse();
            const search = (object, path) => {
                const key = path.pop();
                if (!(key in object)) return undefined;
                const value = object[key];
                if (path.length === 0) return value;
                return search(value, path);
            };
            const value = core.data.treatAs(search(source, path), type);
            if (value === null) {
                if (fallback === undefined) throw new Error(`Missing required ${type} field "${field}".`);
                return fallback;
            }
            return value;
        },

        /**
         * Attempts to treat 'value' as 'type'
         * @param {any} value 
         * @param {ParsableType} type 
         * @returns 'value' as 'type' data type, null otherwise.
         */
        treatAs(value, type) {
            if (value === null || value === undefined) return null;
            switch (type) {
                case 'string':
                    return String(value);
                case 'number':
                    value = parseFloat(value);
                    if (isNaN(value)) return null;
                    return value;
                case 'boolean':
                    return Boolean(value);
                case 'date':
                    value = date.parse(value);
                    if (isNaN(value)) return null;
                    return value;
                case 'object':
                    return value;
                default:
                    throw new Error(`Invalid type "${type}".`);
            }
        }

    },

    // Tools for generating random values
    random: {

        /**
         * Generates a random hexidecimal number 'size' characters long
         * @param {number} [size] Defaults to 16
         * @returns 
         */
        token(size = 16) {
            return crypto.randomBytes(Math.round(size / 2)).toString('hex');
        }

    },

    // Tools for manipulating strings of text
    text: {

        /**
         * @param {number} number 
         * @returns 
         */
        getNumberSuffix(number) {
            number %= 10;
            if (number === 1) return 'st';
            if (number === 2) return 'nd';
            if (number === 3) return 'rd';
            return 'th';
        },

        /**
         * Pluralizes 'word'
         * @param {string} word 
         * @param {number} count 
         */
        pluralize(word, count) {
            if (count > 0) {
                if (word.endsWith('s')) return word + 'es';
                return word + 's';
            }
            return word;
        }

    },

    // Tools for working with dates
    time: {

        SHORT_DAY_NAMES: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        LONG_DAY_NAMES: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        SHORT_MONTH_NAMES: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        LONG_MONTH_NAMES: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

        /**
         * Attemps to create a Date object from 'value'
         * @param {string|number|Date} value
         * @returns 
         */
        parse(value) {
            return new Date(value);
        },

        /**
         * Gets the name of the day of the week for 'date'
         * @param {Date} date 
         * @param {boolean} long True for long day name, false for short (ie 'Sunday' vs 'Sun')
         */
        getDay(date, long) {
            return long ? core.time.LONG_DAY_NAMES[date.getDay()] : core.time.SHORT_DAY_NAMES[date.getDay()];
        },

        /**
         * Gets the name of the month for 'date'
         * @param {Date} date 
         * @param {boolean} long True for long month name, false for short (ie 'March' vs 'Mar')
         */
        getMonth(date, long) {
            return long ? core.time.LONG_MONTH_NAMES[date.getMonth()] : core.time.SHORT_MONTH_NAMES[date.getMonth()];
        },

        /**
         * Converts a date to string
         * @param {Date} date
         * @param {boolean} long True for long date (full names and number suffixes), false otherwise
         * @param {boolean} includeDay
         * @param {boolean} includeYear 
         */
        toString(date, long = false, includeDay = true, includeYear = true) {
            const year = date.getFullYear();
            const day = core.time.getDay(date, long);
            const month = core.time.getMonth(date, long);
            const dateOfMonth = long ? `${date.getDate()}${core.text.getNumberSuffix(date.getDate())}` : date.getDate();
            if (includeDay && includeYear) return `${day}, ${month} ${dateOfMonth}, ${year}`;
            if (includeDay && !includeYear) return `${day}, ${month} ${dateOfMonth}`;
            if (!includeDay && includeYear) return `${month} ${dateOfMonth}, ${year}`;
            if (!includeDay && !includeYear) return `${month} ${dateOfMonth}`;
        }

    }

};

module.exports = core;