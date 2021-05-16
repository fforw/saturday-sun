import { describe, it } from "mocha";
import assert from "power-assert";
import { decode, encode, runLengthEncoding } from "../src/encoder";


describe("Encoder", function(){


	it("includes run length encoding", () => {
		const compressed = runLengthEncoding([0,0,0,0,0,5,7,7]);

		assert(compressed.compression)
		assert.deepEqual(
			[ ... compressed.data ],
			[5,0,1,5,2,7]
		)
	})

    it("encodes and decodes UInt16Arrays", function()
	{
		const data = [0,0,0,0,0,1,2,2,3,3,3];
		const encoded = encode(data);

		assert(encoded.indexOf(";") >= 0)

		assert.deepEqual(
			[... decode(
				encoded
			)],
			data
		)

		{

			const data = [1,2,3,4,5,6,7,8,9,0,1];
			const encoded = encode(data);

			assert(encoded.indexOf(";") < 0)

			assert.deepEqual(
				[... decode(
					encoded
				)],
				data
			)
		}

		{

			const data = [5000,2,3,4,5,6,7,8,9,0,1];
			const encoded = encode(data);

			assert(encoded.indexOf(";") < 0)
			const back = decode(
				encoded
			);

			// overflow
			assert( back[0] === 904);
		}
	});

});
