"use strict";

var OSFramework;
(function (OSFramework) {
    var DataGridMore;
    (function (DataGridMore) {
        // Formatter object
        var Formatter;
        (function (Formatter) {
            function isValidDateString(input) {
                if (!input || typeof input !== 'string') {
                    return [false, null];
                }
            
                // Trim spaces
                const trimmedInput = input.trim();
            
                // Try parsing with moment (strict: false to allow flexible parsing)
                const date = moment(trimmedInput, moment.ISO_8601, true);
            
                if (date.isValid()) {
                    return [true, date.format('DD/MM/YYYY')];
                }
            
                // Try parsing with common fallback formats
                const fallbackFormats = [
                    // 'dd-MM-YYYY',
                    'DD-MM-YYYY',
                    'DD/MM/YYYY',
                    'YYYY/M/D',
                    'YYYY/M/DD',
                    'YYYY/MM/D',
                    'YYYY-MM-D',
                    'YYYY-M-DD',
                    'YYYY-MM-DD',
                    'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ (z)' // Mon Mar 17 2025 00:00:00 GMT+0700 (Indochina Time)
                ];
            
                const fallbackDate = moment(trimmedInput, fallbackFormats, true);
                return [fallbackDate.isValid(), fallbackDate._f];
            }            

            /**
             * @param value String date value
             * @param prompt String Prompt message
             * @param format String Date format
             * 
             * @author XinTA - 2024-12-23
             */
            function formatDateValue(value, prompt, format) {
                if (value) {
                    let [isValid, currentFormat] = isValidDateString(value)
                    if (!isValid) {
                        return prompt;
                    }
                    return moment(value, currentFormat).format(format);
                }
                return prompt
            }

            function FormatInvalidDateField(columnId, value, prompt, format = "dd/MM/yyyy") {
                // Set column template
                OutSystems.GridAPI.ColumnManager.GetColumnById(columnId)._provider.cellTemplate = function (item) {
                    return formatDateValue(item.value, prompt, format);
                }
                
                // Return formatted value for immediate use if needed
                return formatDateValue(value, prompt, format);
            }
            
            // Expose formatDateValue for testing
            Formatter.__formatDateValue = formatDateValue;
            Formatter.FormatInvalidDateField = FormatInvalidDateField;
        })(Formatter = DataGridMore.Formatter || (DataGridMore.Formatter = {}));

        // Testcases object
        var Testcases;
        (function (Testcases) {
            function RunTest() {
                const prompt = "Invalid date";
                const format = "DD/MM/yyyy";
            
                console.log("=== Date Formatter Tests ===");
            
                console.log("Test 1 :", DataGridMore.Formatter.__formatDateValue(null, prompt, format), "=== Expected:", prompt);
                console.log("Test 2 :", DataGridMore.Formatter.__formatDateValue(undefined, prompt, format), "=== Expected:", prompt);
                console.log("Test 3 :", DataGridMore.Formatter.__formatDateValue("", prompt, format), "=== Expected:", prompt);
            
                console.log("Test 4 :", DataGridMore.Formatter.__formatDateValue(123, prompt, format), "=== Expected:", prompt);
                console.log("Test 5 :", DataGridMore.Formatter.__formatDateValue({}, prompt, format), "=== Expected:", prompt);
                console.log("Test 6 :", DataGridMore.Formatter.__formatDateValue([], prompt, format), "=== Expected:", prompt);
                console.log("Test 7 :", DataGridMore.Formatter.__formatDateValue(true, prompt, format), "=== Expected:", prompt);
                console.log("Test 8 :", DataGridMore.Formatter.__formatDateValue(false, prompt, format), "=== Expected:", prompt);
            
                console.log("Test 9 :", DataGridMore.Formatter.__formatDateValue("abcd-ef-gh", prompt, format), "=== Expected:", prompt);
                console.log("Test10:", DataGridMore.Formatter.__formatDateValue("2025-02-30", prompt, format), "=== Expected:", prompt);
                console.log("Test11:", DataGridMore.Formatter.__formatDateValue("2025-13-01", prompt, format), "=== Expected:", prompt);
                console.log("Test12:", DataGridMore.Formatter.__formatDateValue("2025-00-01", prompt, format), "=== Expected:", prompt);
                console.log("Test13:", DataGridMore.Formatter.__formatDateValue("2023-02-29", prompt, format), "=== Expected:", prompt);
            
                console.log("Test14:", DataGridMore.Formatter.__formatDateValue("2025-03-17T00:00:00Z", prompt, format), "=== Expected: 17/03/2025");
                console.log("Test15:", DataGridMore.Formatter.__formatDateValue("2025/03/17", prompt, format), "=== Expected: 17/03/2025");
                console.log("Test16:", DataGridMore.Formatter.__formatDateValue("17-03-2025", prompt, format), "=== Expected: 17/03/2025");
                console.log("Test17:", DataGridMore.Formatter.__formatDateValue("2025-3-17", prompt, format), "=== Expected: 17/03/2025");
                console.log("Test18:", DataGridMore.Formatter.__formatDateValue("2025-03-7", prompt, format), "=== Expected: 07/03/2025");
                console.log("Test19:", DataGridMore.Formatter.__formatDateValue("07/03/2025", prompt, format), "=== Expected: 07/03/2025");
            
                console.log("Test20:", DataGridMore.Formatter.__formatDateValue("2025-03-17", prompt, format), "=== Expected: 17/03/2025");
                console.log("Test21:", DataGridMore.Formatter.__formatDateValue("2024-02-29", prompt, format), "=== Expected: 29/02/2024");
                console.log("Test22:", DataGridMore.Formatter.__formatDateValue(" 2025-03-17 ", prompt, format), "=== Expected: 17/03/2025");
                console.log("Test23:", DataGridMore.Formatter.__formatDateValue("2025-03-01", prompt, format), "=== Expected: 01/03/2025");
                console.log("Test24:", DataGridMore.Formatter.__formatDateValue("2025-03-31", prompt, format), "=== Expected: 31/03/2025");
                console.log("Test25:", DataGridMore.Formatter.__formatDateValue("2025-12-31", prompt, format), "=== Expected: 31/12/2025");
                console.log("Test26:", DataGridMore.Formatter.__formatDateValue("2025-01-01", prompt, format), "=== Expected: 01/01/2025");
            }
            
            Testcases.RunTest = RunTest;
        })(Testcases = DataGridMore.Testcases || (DataGridMore.Testcases = {}));
    })(DataGridMore = OSFramework.DataGridMore || (OSFramework.DataGridMore = {}));
})(OSFramework || (OSFramework = {}));

// To run tests:
// OSFramework.DataGridMore.Testcases.RunTest();
