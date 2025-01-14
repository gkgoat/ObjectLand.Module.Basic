

export default class ExpressionEvaluator {
    async evaluate(expr, runtime) {
        this.runtime = runtime;
        return await this._evaluateNode(expr);
    }

    async _evaluateNode(node) {
        if (!node) return undefined;

        else if (node.type == 4 || // Deciaml Number
            node.type == 5 || // Octal Number
            node.type == 6 || // Hexa Number
            node.type == 8    // String
        ) {
            return node.value
        }

        // Uniary Operators
        else if (node.prefix) {
            var op_fn = this.runtime.operators.get_uniary(node.operator);

            if (op_fn)
                return op_fn(await this._evaluateNode(node.argument))
            else
                throw `Invalid Operator ${node.operator}`
        }

        // Binary Operators
        else if (node.is_binary) {
            var left = await this._evaluateNode(node.left);
            var right = await this._evaluateNode(node.right);
            var op_fn = this.runtime.operators.get_binary(node.operator);

            if (op_fn)
                return op_fn(left, right)
            else
                throw `Invalid Operator ${node.operator}`
        }


        // Array
        else if (node.is_array) {
            var arr = [];
            for (var el of node.object) {
                arr.push(await this._evaluateNode(el));
            }
            return arr;
        }

        // Identifier
        else if (node.type == 9) {
            return this.runtime.var_manager.get(node.text);
        }

        // array index
        else if (node.type == 15) {
            var variable = this.runtime.var_manager.get(node.object.text);
            var index = await this._evaluateNode(node.property);
            if (variable) {
                return variable.val[index];
            }
            else {
                throw `Index '${index}' out of range`;
            }
        }

        // function calls
        else if (node.type == 16) {
            var fn = this.runtime.fn_manager.get(node.object.text);
            var fn_args = Array.isArray(node.property) ? node.property : [node.property];
            var args = [];
            for (var arg of fn_args) {
                args.push(await this._evaluateNode(arg));
            }

            if (fn) {
                return fn(...args);
            }
            else {
                throw `Function '${node.object.text}' is not defined`;
            }
        }
    }
}

